import { GoogleGenAI } from "@google/genai";
import { logOperation } from "@/lib/logger";

/**
 * Vision OCR provider.
 *
 * OCR renders each PDF page to an image and sends it to a VISION-CAPABLE model.
 * The provider is intentionally configurable so any compatible vision API can
 * be plugged in later:
 *   - VISION_API_KEY   (required)
 *   - VISION_MODEL     (default gemini-3.6-flash)
 *   - VISION_BASE_URL  (optional; only set when using a custom endpoint)
 *
 * The current implementation uses the official @google/genai SDK, so a Google
 * Gemini API key is the compatible option today. Never send rendered page
 * images to the NVIDIA DeepSeek text model (or any other text-only model).
 */

const VISION_API_KEY = process.env.VISION_API_KEY;
const VISION_MODEL = process.env.VISION_MODEL || "gemini-3.6-flash";
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

export type VisionErrorKind =
  | "rate_limit" // temporary 429 — safe to retry with backoff
  | "quota_exhausted" // daily/monthly quota used up — do NOT retry
  | "auth" // 401/403 — configuration problem
  | "model_unavailable" // 404 — wrong model/endpoint
  | "other"; // 400, 5xx, network, unknown

/**
 * Structured vision error so callers can distinguish retryable rate limits
 * from exhausted quotas and other failures. Never embeds raw API payloads.
 */
export class VisionApiError extends Error {
  readonly kind: VisionErrorKind;
  readonly status: number | null;
  /** Retry delay suggested by the API (Google rpc.RetryInfo), if any. */
  readonly retryAfterMs: number | null;

  constructor(
    kind: VisionErrorKind,
    message: string,
    options: { status?: number | null; retryAfterMs?: number | null } = {},
  ) {
    super(message);
    this.name = "VisionApiError";
    this.kind = kind;
    this.status = options.status ?? null;
    this.retryAfterMs = options.retryAfterMs ?? null;
  }
}

// Bounded exponential backoff for transient rate limits (5s, 10s, 20s,
// initial call + 3 retries). Always bounded so a runaway API never burns the
// whole Vercel function budget inside one page.
const RETRY_DELAYS_MS = [5_000, 10_000, 20_000];
const MAX_RETRIES = 3;
const MAX_RETRY_AFTER_MS = 60_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parses a Google duration string ("5s", "500ms", "1.5m") to milliseconds.
 * Returns null for anything unparseable.
 */
function parseGoogleDuration(raw: string): number | null {
  const match = /^\s*(\d+(?:\.\d+)?)\s*(ms|s|m|h)?\s*$/i.exec(raw);
  if (!match) return null;
  const value = Number(match[1]);
  const unit = (match[2] ?? "s").toLowerCase();
  const factor =
    unit === "ms" ? 1 : unit === "s" ? 1000 : unit === "m" ? 60_000 : 3_600_000;
  return Math.round(value * factor);
}

/**
 * Extracts the API-provided retry delay from a Google error body. The Gemini
 * REST error shape carries it as `error.details[].retryDelay` (a
 * google.rpc.RetryInfo field), e.g. `"retryDelay":"5s"`. This is the closest
 * equivalent to an HTTP `Retry-After` header in the SDK error.
 */
function extractRetryAfterMs(err: unknown): number | null {
  if (!(err instanceof Error)) return null;
  try {
    const parsed = JSON.parse(err.message) as { error?: { details?: unknown } };
    const details = parsed?.error?.details;
    if (!Array.isArray(details)) return null;
    for (const detail of details) {
      if (detail && typeof detail === "object" && "retryDelay" in detail) {
        const raw = (detail as { retryDelay?: unknown }).retryDelay;
        if (typeof raw === "string") {
          const ms = parseGoogleDuration(raw);
          if (ms != null && ms > 0) return ms;
        }
      }
    }
  } catch {
    // Not a structured API error.
  }
  return null;
}

/**
 * Distinguishes an exhausted quota from a temporary rate limit. Gemini marks
 * both as HTTP 429; only the message text tells them apart. Quota errors say
 * things like "Quota exceeded for metric '..._per_day': 500 per day."
 */
function isQuotaExhausted(message: string | null): boolean {
  if (!message) return false;
  return /quota|per day|per month|per minute|per hour|per request|requests per|tokens per|daily limit/i.test(
    message,
  );
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

function describeVisionError(err: unknown): VisionApiError {
  const status =
    err && typeof err === "object" && "status" in err
      ? Number((err as { status?: unknown }).status)
      : NaN;
  const retryAfterMs = extractRetryAfterMs(err);
  const safeApiMessage = extractApiMessage(err);
  const fallback = err instanceof Error ? err.message : String(err);

  if (status === 401) {
    return new VisionApiError(
      "auth",
      "Vision API authentication failed. Check VISION_API_KEY.",
      { status, retryAfterMs },
    );
  }
  if (status === 403) {
    return new VisionApiError(
      "auth",
      "Vision API access denied. Check Gemini API permissions.",
      { status, retryAfterMs },
    );
  }
  if (status === 404) {
    return new VisionApiError(
      "model_unavailable",
      `Vision API returned 404 for model '${VISION_MODEL}'. Check the model name or endpoint.`,
      { status, retryAfterMs },
    );
  }
  if (status === 429) {
    if (isQuotaExhausted(safeApiMessage)) {
      return new VisionApiError(
        "quota_exhausted",
        "Gemini OCR quota has been reached. Completed pages are saved. Retry later to continue.",
        { status, retryAfterMs },
      );
    }
    return new VisionApiError(
      "rate_limit",
      "Gemini OCR is temporarily unavailable due to rate limits. Your completed pages are saved. Retry later.",
      { status, retryAfterMs },
    );
  }
  if (status === 400) {
    return new VisionApiError(
      "other",
      `Vision API rejected the request: ${safeApiMessage ?? fallback.slice(0, 300)}`,
      { status, retryAfterMs },
    );
  }
  if (status >= 500 && status <= 599) {
    return new VisionApiError(
      "other",
      `Vision API service error (${status}): ${safeApiMessage ?? "Please retry."}`,
      { status, retryAfterMs },
    );
  }
  if (Number.isFinite(status)) {
    return new VisionApiError(
      "other",
      `Vision API request failed (${status}): ${safeApiMessage ?? "unknown error"}`,
      { status, retryAfterMs },
    );
  }
  return new VisionApiError(
    "other",
    `Vision API request failed: ${fallback.slice(0, 300)}`,
    { status, retryAfterMs },
  );
}

/**
 * Transcribes a single page image with the vision model.
 * Pages are always processed one at a time so progress can be reported and
 * one bad page never fails the whole document.
 *
 * Transient rate limits (HTTP 429) are retried with bounded exponential
 * backoff (5s, 10s, 20s, max 3 retries), honoring the API's retryDelay when
 * provided. Exhausted quotas are NOT retried — they stop cleanly so the
 * caller can tell the user to come back later.
 */
export async function transcribePage({
  page,
  image,
  mime,
  onRetry,
}: PageImage & {
  /** Called before each backoff wait so the caller can stream status. */
  onRetry?: (info: { attempt: number; delayMs: number }) => void;
}): Promise<string> {
  const parts = [
    { text: USER_PROMPT },
    { text: `=== PAGE ${page} ===` },
    {
      inlineData: { mimeType: mime ?? "image/png", data: image.toString("base64") },
    },
  ];

  for (let attempt = 0; ; attempt++) {
    try {
      const response = await getClient().models.generateContent({
        model: VISION_MODEL,
        contents: [{ role: "user", parts }],
        config: {
          systemInstruction: { role: "user", parts: [{ text: SYSTEM }] },
          temperature: 0.1,
          maxOutputTokens: 6000,
          httpOptions: { timeout: 120_000 },
        },
      });

      const raw = response.text?.trim();
      if (!raw) return "";

      const entries = parseByPage(raw, [page]);
      return entries[0]?.text ?? "";
    } catch (err) {
      const vErr = describeVisionError(err);
      if (vErr.kind !== "rate_limit" || attempt >= MAX_RETRIES) {
        throw vErr;
      }
      const delayMs =
        vErr.retryAfterMs && vErr.retryAfterMs > 0
          ? Math.min(vErr.retryAfterMs, MAX_RETRY_AFTER_MS)
          : RETRY_DELAYS_MS[attempt];
      logOperation({
        operation: "vision.retry",
        stage: "rate_limit_backoff",
        page,
        model: VISION_MODEL,
        status: vErr.status ?? undefined,
        attempt: attempt + 1,
        delayMs,
      });
      onRetry?.({ attempt: attempt + 1, delayMs });
      await sleep(delayMs);
    }
  }
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
