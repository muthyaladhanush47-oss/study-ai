import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openRouterChat } from "@/lib/openrouter";
import { extractJson } from "@/lib/ai/extract";
import { getOwnedDocument, logActivity } from "@/lib/ai/document";
import type { NotesResult, NoteSection, StudyNote } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM = [
  "You are an expert study assistant who writes notes the way a great student would.",
  "Turn the provided study notes into structured, exam-ready notes with handwritten-style sections.",
  'Return ONLY valid JSON matching this exact schema: {"overview": string, "notes": [{"chapter": string, "sections": [{"kind": "definition", "text": string}]}]}.',
  "The overview should be 2-3 sentences covering the whole document.",
  "Split the document into chapters or logical sections. For each chapter build a sections array.",
  "Allowed section kinds and their content rules:",
  "- definition: the core concept, written in plain student-friendly words.",
  "- remember: a bullet titled 'Important Points' — 2-3 short sentences capturing the most important ideas.",
  "- trick: a memory trick / mnemonic / shortcut. If there is a known mnemonic, include it.",
  "- equation: a compact formula or equation (use plain text with arrows; the UI renders it large).",
  "- examQuestions: 2-4 exam-style questions a teacher would actually ask.",
  "- fiveMarkAnswer: a full 5-mark exam answer (~120-180 words) that would score top marks.",
  "- oneLineRevision: a single-sentence revision note that captures the whole chapter.",
  "Every chapter MUST include at least: definition, remember, and oneLineRevision. Include equation, trick, examQuestions and fiveMarkAnswer only when the material supports them.",
  "Write naturally and concisely, like an excellent student's class notes — not like an essay.",
].join("\n");

const SCHEMA: Record<NoteSection["kind"], { label: string }> = {
  definition: { label: "Definition" },
  remember: { label: "Important Points" },
  trick: { label: "Trick" },
  equation: { label: "Equation" },
  examQuestions: { label: "Exam questions" },
  fiveMarkAnswer: { label: "5 mark answer" },
  oneLineRevision: { label: "One line revision" },
};

function sanitizeSections(raw: unknown): NoteSection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s): NoteSection | null => {
      if (typeof s !== "object" || s === null) return null;
      const kind = (s as { kind?: unknown }).kind;
      if (typeof kind !== "string" || !(kind in SCHEMA)) return null;
      const k = kind as NoteSection["kind"];
      if (k === "examQuestions") {
        const items = Array.isArray((s as { items?: unknown }).items)
          ? (s as { items: unknown[] }).items.map((i) => String(i).trim()).filter(Boolean)
          : [];
        return items.length ? { kind: k, items } : null;
      }
      const text = String((s as { text?: unknown }).text ?? "").trim();
      return text ? { kind: k, text } : null;
    })
    .filter((s): s is NoteSection => s !== null);
}

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
      { error: "This PDF has no extractable text to turn into notes." },
      { status: 422 },
    );
  }

  const raw = await openRouterChat({
    system: SYSTEM,
    messages: [{ role: "user", content: doc.content }],
    temperature: 0.4,
    maxTokens: 8192,
    json: true,
  });

  const parsed = extractJson<NotesResult>(raw);
  const notes: StudyNote[] = Array.isArray(parsed.notes)
    ? parsed.notes
        .map((n) => ({
          chapter: String(n.chapter ?? "").trim(),
          sections: sanitizeSections(n.sections),
        }))
        .filter((n) => n.chapter && n.sections.length > 0)
    : [];

  await logActivity(supabase, {
    userId: user.id,
    documentId: doc.id,
    type: "summary",
    title: doc.title,
    metadata: { noteCount: notes.length, source: "ai-notes" },
  });

  return NextResponse.json({
    overview: typeof parsed.overview === "string" ? parsed.overview : "",
    notes,
  });
}
