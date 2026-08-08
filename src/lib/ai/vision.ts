import {
  geminiGenerateText,
  GEMINI_VISION_MODEL,
  type GeminiContentPart,
} from "@/lib/gemini";

export type PageImage = {
  page: number;
  image: Buffer;
  mime?: string;
};

const SYSTEM = [
  "You are an expert transcription engine for students' study notes.",
  "You will receive images of PDF pages or photos that may contain TYPED and HANDWRITTEN text, formulas, equations, diagrams with labels, margin notes, highlights, tables and lists.",
  "Transcribe EVERYTHING VERBATIM, exactly as it appears. Do not summarize and do not skip content.",
  "Preserve structure exactly: headings, bullet lists, numbered lists, indentation, and page order.",
  "Write formulas and equations in plain ASCII/LaTeX when readable (e.g. E = mc^2, a^2 + b^2 = c^2).",
  "For diagrams, charts, figures and drawings, describe what they show in square brackets, e.g. [diagram: mitochondria labelled, pointing to cristae].",
  "Preserve every heading verbatim, even if it is handwritten or underlined.",
  "NEVER guess or invent text. If a word, phrase or passage cannot be read confidently, write [illegible]. If a passage is partially unclear, write [unclear]. If a page has no readable text, write '(no readable text)'.",
  "For each image, first output the page marker on its own line, then the transcription.",
].join("\n");

const USER_PROMPT = [
  "The image below is a page of the student's notes.",
  'Output exactly:\n=== PAGE <number> ===\n<full transcription>\n',
  "If a page contains no readable text at all, output its marker followed by '(no readable text)'.",
].join("\n");

/**
 * Transcribes a single page image with the vision model.
 * Pages are always processed one at a time so progress can be reported and
 * one bad page never fails the whole document.
 */
export async function transcribePage({
  page,
  image,
  mime,
}: PageImage): Promise<string> {
  const parts: GeminiContentPart[] = [
    { type: "text", text: USER_PROMPT },
    { type: "text", text: `=== PAGE ${page} ===` },
    {
      type: "image",
      mimeType: mime ?? "image/png",
      base64: image.toString("base64"),
    },
  ];

  const raw = await geminiGenerateText({
    model: GEMINI_VISION_MODEL,
    system: SYSTEM,
    messages: [{ role: "user", content: parts }],
    temperature: 0.1,
    maxTokens: 6000,
    timeoutMs: 120_000,
  });

  const entries = parseByPage(raw, [page]);
  return entries[0]?.text ?? "";
}

function parseByPage(
  raw: string,
  pages: number[],
): { page: number; text: string }[] {
  const regex = /=== PAGE\s+(\d+)\s*===\s*/gi;
  const markers: { page: number; start: number; contentStart: number }[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    markers.push({
      page: Number(match[1]),
      start: match.index,
      contentStart: regex.lastIndex,
    });
  }

  if (markers.length === 0) {
    if (pages.length === 1) {
      return [{ page: pages[0], text: raw.trim() }];
    }
    return pages.map((page) => ({ page, text: "" }));
  }

  const out: { page: number; text: string }[] = [];
  markers.forEach((marker, i) => {
    const end =
      i + 1 < markers.length ? markers[i + 1].start : raw.length;
    out.push({
      page: marker.page,
      text: raw.slice(marker.contentStart, end).trim(),
    });
  });

  return out;
}
