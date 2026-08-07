import { openRouterChat, type OpenRouterContentPart } from "@/lib/openrouter";

const VISION_MODEL =
  process.env.OPENROUTER_VISION_MODEL || "google/gemini-2.5-flash";

export type PageImage = {
  page: number;
  image: Buffer;
  mime?: string;
};

const SYSTEM = [
  "You are an expert transcription engine for students' study notes.",
  "You will receive one or more images of PDF pages that may contain TYPED and HANDWRITTEN text, diagrams with labels, formulas, margin notes, and highlights.",
  "Transcribe EVERY page VERBATIM, exactly as it appears.",
  "Preserve structure: headings, bullet lists, numbered lists, and indentation.",
  "Write formulas in plain ASCII/LaTeX when readable (e.g. E = mc^2).",
  "For each image, first output the page marker on its own line, then the transcription.",
].join("\n");

const USER_PROMPT = [
  "The images below are pages of the student's notes.",
  'For each page output exactly:\n=== PAGE <number> ===\n<full transcription>\n',
  "If a page contains no readable text, output its marker followed by '(no readable text)'.",
].join("\n");

/**
 * Sends all page images in one request and returns per-page transcriptions.
 */
export async function transcribePages(
  images: PageImage[],
): Promise<{ page: number; text: string }[]> {
  if (images.length === 0) return [];

  const parts: OpenRouterContentPart[] = [
    { type: "text", text: USER_PROMPT },
  ];
  for (const { page, image, mime } of images) {
    parts.push({ type: "text", text: `=== PAGE ${page} ===` });
    parts.push({
      type: "image_url",
      image_url: {
        url: `data:${mime ?? "image/png"};base64,${image.toString("base64")}`,
      },
    });
  }

  const raw = await openRouterChat({
    model: VISION_MODEL,
    system: SYSTEM,
    messages: [{ role: "user", content: parts }],
    temperature: 0.1,
    maxTokens: 65_536,
  });

  return parseByPage(raw, images.map((i) => i.page));
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
    // Model ignored the markers — give each page an empty slot so the caller
    // still records progress without crashing.
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
