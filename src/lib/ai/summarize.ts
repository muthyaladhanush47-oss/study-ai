import { openRouterChat } from "@/lib/openrouter";
import { extractJson } from "@/lib/ai/extract";
import { logOperation } from "@/lib/logger";
import type { NotesResult, NoteSection, StudyNote } from "@/types";

/**
 * Chunked summarization pipeline.
 *
 * 1. Each content chunk is summarized into a compact, structured digest.
 * 2. All digests are synthesized into the existing NotesResult shape
 *    (overview + chapters of definition/remember/trick/equation/
 *    examQuestions/fiveMarkAnswer/oneLineRevision sections).
 *
 * The original document text is never sent to the final synthesis model —
 * only the compact per-chunk digests are.
 */

export type ChunkSummary = {
  chunkIndex: number;
  page: number | null;
  concepts: string[];
  definitions: { term: string; definition: string }[];
  keyPoints: string[];
  formulas: string[];
  examples: string[];
  examRelevant: string[];
  possibleQuestions: string[];
};

const CHUNK_SYSTEM = [
  "You are an expert study assistant.",
  "You will receive one section of a student's study document.",
  "Extract the important exam-relevant information into a compact structured digest.",
  "Return ONLY valid JSON matching this exact schema:",
  '{"concepts": string[], "definitions": [{"term": string, "definition": string}], "keyPoints": string[], "formulas": string[], "examples": string[], "examRelevant": string[], "possibleQuestions": string[]}.',
  "Rules:",
  "- concepts: the main topics mentioned (3-8 short phrases).",
  "- definitions: only real definitions found in the text, as term/definition pairs.",
  "- keyPoints: the most important points, one short sentence each.",
  "- formulas: formulas or equations in plain ASCII/LaTeX (skip if none).",
  "- examples: worked examples or concrete instances in the text (skip if none).",
  "- examRelevant: facts a student must know for an exam.",
  "- possibleQuestions: 2-4 exam-style questions answerable from this section.",
  "Never invent content that is not in the text. If a category has nothing, return an empty array.",
  "Keep the digest compact — short phrases and sentences only.",
].join("\n");

const SYNTHESIS_SYSTEM = [
  "You are an expert study assistant who writes notes the way a great student would.",
  "You will receive structured digests of a study document, extracted per section, with optional page numbers.",
  "Combine them into one cohesive set of exam-ready notes with handwritten-style sections.",
  'Return ONLY valid JSON matching this exact schema: {"overview": string, "notes": [{"chapter": string, "sections": [{"kind": "definition", "text": string}]}]}.',
  "The overview should be 2-3 sentences covering the whole document.",
  "Organize the notes into chapters or logical sections. For each chapter build a sections array.",
  "Allowed section kinds and their content rules:",
  "- definition: the core concept, written in plain student-friendly words.",
  "- remember: a bullet titled 'Important Points' — 2-3 short sentences capturing the most important ideas.",
  "- trick: a memory trick / mnemonic / shortcut. If there is a known mnemonic, include it.",
  "- equation: a compact formula or equation (use plain text with arrows).",
  "- examQuestions: 2-4 exam-style questions a teacher would actually ask.",
  "- fiveMarkAnswer: a full 5-mark exam answer (~120-180 words) that would score top marks.",
  "- oneLineRevision: a single-sentence revision note that captures the whole chapter.",
  "Every chapter MUST include at least: definition, remember, and oneLineRevision. Include equation, trick, examQuestions and fiveMarkAnswer only when the source material supports them.",
  "Write naturally and concisely, like an excellent student's class notes — not like an essay.",
  "The digests are authoritative: do not invent facts, formulas, or page numbers that are not present in them.",
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

export function sanitizeSections(raw: unknown): NoteSection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s): NoteSection | null => {
      if (typeof s !== "object" || s === null) return null;
      const kind = (s as { kind?: unknown }).kind;
      if (typeof kind !== "string" || !(kind in SCHEMA)) return null;
      const k = kind as NoteSection["kind"];
      if (k === "examQuestions") {
        const rawItems = (s as { items?: unknown }).items;
        const items = Array.isArray(rawItems)
          ? (rawItems as unknown[]).map((i) => String(i).trim()).filter(Boolean)
          : [];
        return items.length ? { kind: k, items } : null;
      }
      const text = String((s as { text?: unknown }).text ?? "").trim();
      return text ? { kind: k, text } : null;
    })
    .filter((s): s is NoteSection => s !== null);
}

function sanitizeNotesResult(raw: unknown): NotesResult | null {
  if (typeof raw !== "object" || raw === null) return null;
  const parsed = raw as { overview?: unknown; notes?: unknown };
  const overview =
    typeof parsed.overview === "string" ? parsed.overview.trim() : "";
  const notes: StudyNote[] = Array.isArray(parsed.notes)
    ? parsed.notes
        .map((n) => {
          if (typeof n !== "object" || n === null) return null;
          const chapter = String((n as { chapter?: unknown }).chapter ?? "").trim();
          const sections = sanitizeSections((n as { sections?: unknown }).sections);
          return chapter && sections.length > 0 ? { chapter, sections } : null;
        })
        .filter((n): n is StudyNote => n !== null)
    : [];

  if (notes.length === 0) return null;
  return { overview, notes };
}

function sanitizeChunkSummary(
  chunkIndex: number,
  page: number | null,
  raw: unknown,
): ChunkSummary | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const strArray = (v: unknown): string[] =>
    Array.isArray(v)
      ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, 12)
      : [];
  const definitions = Array.isArray(o.definitions)
    ? o.definitions
        .map((d) => {
          if (typeof d !== "object" || d === null) return null;
          const term = String((d as { term?: unknown }).term ?? "").trim();
          const definition = String((d as { definition?: unknown }).definition ?? "").trim();
          return term && definition ? { term, definition } : null;
        })
        .filter((d): d is { term: string; definition: string } => d !== null)
        .slice(0, 12)
    : [];

  const summary: ChunkSummary = {
    chunkIndex,
    page,
    concepts: strArray(o.concepts),
    definitions,
    keyPoints: strArray(o.keyPoints),
    formulas: strArray(o.formulas),
    examples: strArray(o.examples),
    examRelevant: strArray(o.examRelevant),
    possibleQuestions: strArray(o.possibleQuestions),
  };

  const hasContent =
    summary.concepts.length > 0 ||
    summary.definitions.length > 0 ||
    summary.keyPoints.length > 0 ||
    summary.formulas.length > 0 ||
    summary.examples.length > 0 ||
    summary.examRelevant.length > 0 ||
    summary.possibleQuestions.length > 0;

  return hasContent ? summary : null;
}

async function callChunkSummary(
  chunk: { index: number; page: number | null; text: string },
  totalChunks: number,
  log: (fields: Record<string, unknown>) => void,
): Promise<ChunkSummary> {
  const content = `Section ${chunk.index} of ${totalChunks}${
    chunk.page != null ? ` (page ${chunk.page})` : ""
  }:\n\n${chunk.text}`;

  const attempt = async (): Promise<ChunkSummary> => {
    const raw = await openRouterChat({
      system: CHUNK_SYSTEM,
      messages: [{ role: "user", content }],
      temperature: 0.3,
      maxTokens: 4096,
      json: true,
    });
    const parsed = extractJson<unknown>(raw);
    const summary = sanitizeChunkSummary(chunk.index, chunk.page, parsed);
    if (!summary) {
      throw new Error("AI returned an invalid chunk digest (empty or malformed JSON).");
    }
    return summary;
  };

  try {
    return await attempt();
  } catch (firstErr) {
    log({ chunkIndex: chunk.index, error: firstErr });
    // Retry once — transient model/network failures are common.
    return await attempt();
  }
}

/** Summarizes every chunk independently with one retry each. */
export async function summarizeChunks(
  chunks: { index: number; page: number | null; text: string }[],
  log: (fields: Record<string, unknown>) => void,
  onChunkProgress?: (done: number, total: number) => void,
): Promise<ChunkSummary[]> {
  const summaries: ChunkSummary[] = [];
  for (let i = 0; i < chunks.length; i++) {
    onChunkProgress?.(i + 1, chunks.length);
    summaries.push(await callChunkSummary(chunks[i], chunks.length, log));
  }
  return summaries;
}

/**
 * Combines per-chunk digests into the existing NotesResult format.
 * Only digest data is sent to the model — never the full source text.
 *
 * When `rawContent` is provided (single small document), it is sent directly
 * instead of digests; the caller guarantees it fits the model context.
 */
export async function synthesizeNotes(
  summaries: ChunkSummary[],
  title: string,
  rawContent?: string,
): Promise<NotesResult> {
  const input =
    rawContent != null
      ? { title, content: rawContent }
      : {
          title,
          totalSections: summaries.length,
          digests: summaries.map((s) => ({
            section: s.chunkIndex,
            page: s.page ?? null,
            concepts: s.concepts,
            definitions: s.definitions,
            keyPoints: s.keyPoints,
            formulas: s.formulas,
            examples: s.examples,
            examRelevant: s.examRelevant,
            possibleQuestions: s.possibleQuestions,
          })),
        };

  // Never send the raw document to the final model when chunked; only the
  // compact digests. Guard the request size as a hard safety net regardless.
  const payload = JSON.stringify(input);
  const safePayload = payload.length > 120_000 ? payload.slice(0, 120_000) : payload;

  const raw = await openRouterChat({
    system: SYNTHESIS_SYSTEM,
    messages: [{ role: "user", content: safePayload }],
    temperature: 0.4,
    maxTokens: 8192,
    json: true,
  });

  const parsed = extractJson<unknown>(raw);
  const result = sanitizeNotesResult(parsed);
  if (!result) {
    throw new Error("OpenRouter returned an invalid notes response.");
  }
  return result;
}
