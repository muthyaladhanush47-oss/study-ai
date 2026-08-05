import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openRouterChat } from "@/lib/openrouter";
import { extractJson } from "@/lib/ai/extract";
import { getOwnedDocument, logActivity } from "@/lib/ai/document";
import type { SummaryResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM = [
  "You are an expert study assistant.",
  "Generate a clear, detailed, chapter-by-chapter summary of the provided study notes.",
  'Return ONLY valid JSON matching this exact schema: {"overview": string, "chapters": [{"chapter": string, "summary": string, "keyPoints": string[]}]}.',
  "The overview should be 2-3 sentences covering the whole document.",
  "Each chapter entry should have a short chapter title (e.g. 'Chapter 1: Photosynthesis'), a concise but substantive summary, and 3-6 key points.",
  "If the document has no clear chapters, split it into logical sections yourself.",
].join("\n");

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { documentId?: string };
  const documentId = body.documentId;

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
      { error: "This PDF has no extractable text to summarize." },
      { status: 422 },
    );
  }

  const raw = await openRouterChat({
    system: SYSTEM,
    messages: [{ role: "user", content: doc.content }],
    temperature: 0.3,
    maxTokens: 4096,
    json: true,
  });

  const parsed = extractJson<SummaryResult>(raw);
  const chapters = Array.isArray(parsed.chapters) ? parsed.chapters : [];

  await logActivity(supabase, {
    userId: user.id,
    documentId: doc.id,
    type: "summary",
    title: doc.title,
    metadata: { chapterCount: chapters.length },
  });

  return NextResponse.json({
    overview: typeof parsed.overview === "string" ? parsed.overview : "",
    chapters,
  });
}
