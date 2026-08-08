import { GoogleGenAI } from "@google/genai";
import { logOperation } from "@/lib/logger";

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
 * images to the NVIDIA DeepSeek text model (or any other text-only model).
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

function logVisionConfigSafe() {
  logOperation({
    operation: "vision.config",
    visionApiKeyPresent: Boolean(process.env.VISION_API_KEY),
    visionModelPresent: Boolean(process.env.VISION_MODEL),
    model: VISION_MODEL,
    visionBaseUrlPresent: Boolean(process.env.VISION_BASE_URL),
  });
}

function getClient(): GoogleGenAI {
  if (!VISION_API_KEY) {
    throw new Error(
      "VISION_API_KEY is not configured. OCR needs a vision-capable model (a Google Gemini API key works).",
    );
  }
  if (!client) {
    logVisionConfigSafe();
    client = new GoogleGenAI({
      apiKey: VISION_API_KEY,
      ...(VISION_BASE_URL ? { httpOptions: { baseUrl: VISION_BASE_URL } } : {}),
    });
  }
  return client;
}

/**
 * Extracts the safe API-provided error message from an @google/genai error.
 *
 * The SDK's non-streaming path throws an ApiError whose `.message` is the
 * JSON-stringified error body from the API, e.g.
 *   {"error":{"message":"...","code":404,"status":"NOT_FOUND"}}
 * We pull out only `error.message` (Gemini's own description) and never the
 * raw error, which could embed request data. Returns null when the error is
 * not a structured API error (e.g. a network/fetch failure).
 */
function extractApiMessage(err: unknown): string | null {
  if (!(err instanceof Error)) return null;
  try {
    const parsed = JSON.parse(err.message) as {
      error?: { message?: unknown };
    };
    const apiMessage = parsed?.error?.message;
    if (typeof apiMessage === "string" && apiMessage.trim()) {
      return apiMessage.trim();
    }
  } catch {
    // Not JSON — plain network/client error; nothing safe to extract.
  }
  return null;
}

function describeVisionError(err: unknown): Error {
  const status =
    err && typeof err === "object" && "status" in err
      ? Number((err as { status?: unknown }).status)
      : NaN;
  const safeApiMessage = extractApiMessage(err);
  const fallback = err instanceof Error ? err.message : String(err);

  if (status === 401) {
    return new Error("Vision API authentication failed. Check VISION_API_KEY.");
  }
  if (status === 403) {
    return new Error("Vision API access denied. Check Gemini API permissions.");
  }
  if (status === 404) {
    return new Error(
      `Vision API returned 404 for model '${VISION_MODEL}'. Check the model name or endpoint.`,
    );
  }
  if (status === 429) {
    return new Error("Vision API rate limit/quota exceeded.");
  }
  if (status === 400) {
    return new Error(
      `Vision API rejected the request: ${safeApiMessage ?? fallback.slice(0, 300)}`,
    );
  }
  if (status >= 500 && status <= 599) {
    return new Error(
      `Vision API service error (${status}): ${safeApiMessage ?? "Please retry."}`,
    );
  }
  if (Number.isFinite(status)) {
    return new Error(
      `Vision API request failed (${status}): ${safeApiMessage ?? "unknown error"}`,
    );
  }
  return new Error(`Vision API request failed: ${fallback.slice(0, 300)}`);
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
