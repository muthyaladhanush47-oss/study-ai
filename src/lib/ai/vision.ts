import { GoogleGenAI } from "@google/genai";

/**
 * Vision OCR provider.
 *
 * OCR renders each PDF page to an image and sends it to a VISION-CAPABLE model.
 * The provider is intentionally configurable so any compatible vision API can
 * be plugged in later:
 *   - VISION_API_KEY   (required)
 *   - VISION_MODEL     (default gemini-2.5-flash)
 *   - VISION_BASE_URL  (optional; only set when using a custom endpoint)
 *
 * The current implementation uses the official @google/genai SDK, so a Google
 * Gemini API key is the compatible option today. Never send rendered page
 * images to deepseek-ai/deepseek-v4-flash (or any other text-only model).
 */

const VISION_API_KEY = process.env.VISION_API_KEY;
const VISION_MODEL = process.env.VISION_MODEL || "gemini-2.5-flash";
const VISION_BASE_URL = process.env.VISION_BASE_URL;

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

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!VISION_API_KEY) {
    throw new Error(
      "VISION_API_KEY is not configured. OCR needs a vision-capable model (a Google Gemini API key works).",
    );
  }
  if (!client) {
    client = new GoogleGenAI({
      apiKey: VISION_API_KEY,
      ...(VISION_BASE_URL ? { httpOptions: { baseUrl: VISION_BASE_URL } } : {}),
    });
  }
  return client;
}

function describeVisionError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err);
  const low = message.toLowerCase();
  const status =
    err && typeof err === "object" && "status" in err
      ? Number((err as { status?: unknown }).status)
      : NaN;

  if (
    status === 401 ||
    status === 403 ||
    low.includes("api key") ||
    low.includes("permission_denied") ||
    low.includes("unauthorized")
  ) {
    return new Error(
      "Vision API authentication failed. Check VISION_API_KEY.",
    );
  }
  if (
    status === 429 ||
    low.includes("resource_exhausted") ||
    low.includes("quota") ||
    low.includes("rate limit")
  ) {
    return new Error(
      "Vision API rate limit or quota reached. Please wait a moment and retry.",
    );
  }
  if (
    status === 404 ||
    low.includes("not_found") ||
    low.includes("does not exist") ||
    low.includes("model not found")
  ) {
    return new Error("Vision model is unavailable. Check VISION_MODEL.");
  }
  if (low.includes("user location is not supported")) {
    return new Error(
      "Vision API is not available in your current region. Try a supported region or a different VISION_API_KEY.",
    );
  }
  if (status === 400 || low.includes("invalid argument")) {
    return new Error(
      "Vision API rejected the request. The page image may be too large.",
    );
  }
  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return new Error("Vision API is temporarily unavailable. Please retry.");
  }
  if (Number.isFinite(status)) {
    return new Error(`Vision API request failed (${status}). ${message.slice(0, 200)}`);
  }
  return new Error(`Vision API request failed: ${message.slice(0, 300)}`);
}

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
  const parts = [
    { text: USER_PROMPT },
    { text: `=== PAGE ${page} ===` },
    {
      inlineData: { mimeType: mime ?? "image/png", data: image.toString("base64") },
    },
  ];

  let response;
  try {
    response = await getClient().models.generateContent({
      model: VISION_MODEL,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: { role: "user", parts: [{ text: SYSTEM }] },
        temperature: 0.1,
        maxOutputTokens: 6000,
        httpOptions: { timeout: 120_000 },
      },
    });
  } catch (err) {
    throw describeVisionError(err);
  }

  const raw = response.text?.trim();
  if (!raw) return "";

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
