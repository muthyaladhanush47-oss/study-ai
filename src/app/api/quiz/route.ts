import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { geminiGenerateText } from "@/lib/gemini";
import { extractJson } from "@/lib/ai/extract";
import { getOwnedDocument, logActivity } from "@/lib/ai/document";
import type { QuizQuestion, QuizQuestionType, QuizResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM = [
  "You are an expert exam-prep assistant.",
  "Create a mixed-type quiz from the provided study notes.",
  'Return ONLY valid JSON matching this exact schema: {"questions": [{"type": "mcq" | "truefalse" | "fillblank" | "short", "question": string, "options"?: string[], "correctIndex"?: number, "correctAnswer"?: string, "explanation"?: string}]}.',
  "Use a mix of question types across the quiz: mostly multiple-choice (mcq), plus some true/false (truefalse), fill-in-the-blank (fillblank), and short-answer (short) questions.",
  "For mcq questions: options must have exactly 4 strings, correctIndex is the 0-based index of the correct answer.",
  "For truefalse questions: options are [\"True\", \"False\"] and correctIndex is 0 or 1.",
  "For fillblank questions: write the sentence with an underscore (____) where the answer goes, and put the missing word(s) in correctAnswer.",
  "For short questions: question is the prompt, correctAnswer is a model answer of 1-3 sentences.",
  "Every question must include a short explanation of the correct answer.",
  "Questions should test understanding, not just memorization, and must be answerable from the notes.",
].join("\n");

function normalizeQuestion(raw: unknown): QuizQuestion | null {
  if (typeof raw !== "object" || raw === null) return null;
  const q = raw as Record<string, unknown>;
  const type = String(q.type ?? "mcq") as QuizQuestionType;
  const question = String(q.question ?? "").trim();
  if (!question) return null;

  const explanation = q.explanation ? String(q.explanation).trim() : undefined;

  const base: QuizQuestion = { type, question, explanation };

  if (type === "mcq") {
    const options = Array.isArray(q.options)
      ? q.options.map((o) => String(o).trim()).filter(Boolean)
      : [];
    const correctIndex = Number.isInteger(q.correctIndex) ? (q.correctIndex as number) : -1;
    if (options.length === 4 && correctIndex >= 0 && correctIndex < 4) {
      return { ...base, options, correctIndex };
    }
    return null;
  }

  if (type === "truefalse") {
    const correctIndex = Number.isInteger(q.correctIndex) ? (q.correctIndex as number) : -1;
    if (correctIndex === 0 || correctIndex === 1) {
      return { ...base, options: ["True", "False"], correctIndex };
    }
    return null;
  }

  if (type === "fillblank" || type === "short") {
    const correctAnswer = q.correctAnswer ? String(q.correctAnswer).trim() : "";
    return correctAnswer ? { ...base, correctAnswer } : null;
  }

  return null;
}

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

  const raw = await geminiGenerateText({
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Create a ${count}-question mixed quiz (MCQ, True/False, Fill-in-the-blank, Short answer).\n\n${doc.content}`,
      },
    ],
    temperature: 0.6,
    maxTokens: 8192,
    json: true,
  });

  const parsed = extractJson<QuizResult>(raw);
  const questions = (Array.isArray(parsed.questions) ? parsed.questions : [])
    .map(normalizeQuestion)
    .filter((q): q is QuizQuestion => q !== null);

  await logActivity(supabase, {
    userId: user.id,
    documentId: doc.id,
    type: "quiz",
    title: doc.title,
    metadata: { questionCount: questions.length },
  });

  return NextResponse.json({ questions });
}
