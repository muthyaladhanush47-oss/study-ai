import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nvidiaChat } from "@/lib/nvidia";
import { extractJson } from "@/lib/ai/extract";
import { getOwnedDocument, logActivity } from "@/lib/ai/document";
import type { FlashcardResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM = [
  "You are an expert study assistant.",
  "Create high-quality study flashcards from the provided study notes.",
  "Focus on definitions, key concepts, important facts, and relationships a student must memorize.",
  'Return ONLY valid JSON matching this exact schema: {"cards": [{"front": string, "back": string}]}.',
  "The front should be a short question or prompt. The back should be a concise, accurate answer.",
].join("\n");

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    documentId?: string;
    count?: number;
  };
  const documentId = body.documentId;
  const count = Math.min(Math.max(body.count ?? 10, 5), 30);

  if (!documentId) {
    return NextResponse.json(
      { error: "documentId is required" },
      { status: 400 },
    );
  }

  const doc = await getOwnedDocument(supabase, user.id, documentId);
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (!doc.content.trim()) {
    return NextResponse.json(
      { error: "This PDF has no extractable text to work with." },
      { status: 422 },
    );
  }

  const raw = await nvidiaChat({
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Create ${count} flashcards.\n\n${doc.content}`,
      },
    ],
    temperature: 0.6,
    maxTokens: 4096,
    json: true,
  });

  const parsed = extractJson<FlashcardResult>(raw);
  const cards = (Array.isArray(parsed.cards) ? parsed.cards : []).map(
    (c) => ({
      front: String(c.front ?? ""),
      back: String(c.back ?? ""),
    }),
  );

  await logActivity(supabase, {
    userId: user.id,
    documentId: doc.id,
    type: "flashcards",
    title: doc.title,
    metadata: { count: cards.length },
  });

  return NextResponse.json({ cards });
}
