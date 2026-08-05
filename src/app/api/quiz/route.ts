import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openRouterChat } from "@/lib/openrouter";
import { extractJson } from "@/lib/ai/extract";
import { getOwnedDocument, logActivity } from "@/lib/ai/document";
import type { QuizResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM = [
  "You are an expert exam-prep assistant.",
  "Create a multiple-choice quiz from the provided study notes.",
  'Return ONLY valid JSON matching this exact schema: {"questions": [{"question": string, "options": string[], "correctIndex": number, "explanation": string}]}.',
  "Each question must have exactly 4 options. correctIndex is the 0-based index of the correct answer.",
  "Questions should test understanding, not just memorization, and must be answerable from the notes.",
  "Include a brief explanation for each correct answer.",
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
  const count = Math.min(Math.max(body.count ?? 10, 3), 30);

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

  const raw = await openRouterChat({
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Create ${count} quiz questions.\n\n${doc.content}`,
      },
    ],
    temperature: 0.6,
    maxTokens: 4096,
    json: true,
  });

  const parsed = extractJson<QuizResult>(raw);
  const questions = (Array.isArray(parsed.questions) ? parsed.questions : [])
    .map((q) => ({
      question: String(q.question ?? ""),
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      correctIndex: Number.isInteger(q.correctIndex) ? q.correctIndex : 0,
      explanation: q.explanation ? String(q.explanation) : undefined,
    }))
    .filter((q) => q.question && q.options.length === 4);

  await logActivity(supabase, {
    userId: user.id,
    documentId: doc.id,
    type: "quiz",
    title: doc.title,
    metadata: { questionCount: questions.length },
  });

  return NextResponse.json({ questions });
}
