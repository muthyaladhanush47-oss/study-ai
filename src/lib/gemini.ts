import {
  GoogleGenAI,
  type Content,
  type GenerateContentConfig,
  type Part,
} from "@google/genai";

/**
 * Minimal Gemini provider for the study assistant.
 *
 * All AI calls go through Google's official @google/genai SDK against the
 * Gemini API. Every call is either a single non-streaming generateContent
 * (OCR, summaries, flashcards, quizzes, mind maps) or a token stream
 * generateContentStream (chat). Response sizes are capped via maxTokens so
 * one runaway reply can never exceed a few thousand output tokens.
 */

const API_KEY = process.env.GEMINI_API_KEY;

// Main model used for text generation (summaries, chat, quiz, etc.).
export const GEMINI_TEXT_MODEL =
  process.env.GEMINI_MODEL || "gemini-2.5-flash";
// Vision-capable model used to read handwriting from page images.
export const GEMINI_VISION_MODEL =
  process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";

export type GeminiContentPart =
  | { type: "text"; text: string }
  | { type: "image"; mimeType: string; base64: string };

export type GeminiMessage = {
  role: "user" | "model";
  content: string | GeminiContentPart[];
};

export type GeminiGenerateOptions = {
  model?: string;
  system?: string;
  messages: GeminiMessage[];
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  timeoutMs?: number;
};

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to your environment (.env.local).",
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: API_KEY });
  }
  return client;
}

function toParts(content: string | GeminiContentPart[]): Part[] {
  if (typeof content === "string") {
    return content.trim() ? [{ text: content }] : [];
  }
  const parts: Part[] = [];
  for (const part of content) {
    if (part.type === "text") {
      if (part.text.trim()) parts.push({ text: part.text });
    } else {
      parts.push({
        inlineData: { mimeType: part.mimeType, data: part.base64 },
      });
    }
  }
  return parts;
}

function toContents(messages: GeminiMessage[]): Content[] {
  const contents: Content[] = [];
  for (const message of messages) {
    const parts = toParts(message.content);
    if (parts.length === 0) continue;
    contents.push({ role: message.role, parts });
  }
  return contents;
}

function buildConfig(
  options: GeminiGenerateOptions,
): GenerateContentConfig {
  const config: GenerateContentConfig = {
    temperature: options.temperature,
    maxOutputTokens: options.maxTokens,
  };
  if (options.system) {
    config.systemInstruction = {
      role: "user",
      parts: [{ text: options.system }],
    };
  }
  if (options.json) {
    config.responseMimeType = "application/json";
  }
  return config;
}

function describeError(err: unknown, timeoutMs: number): Error {
  if (err instanceof Error && err.name === "AbortError") {
    return new Error(
      `Gemini request timed out after ${timeoutMs} ms. Please try again.`,
    );
  }

  const message = err instanceof Error ? err.message : String(err);
  const low = message.toLowerCase();
  const status =
    err && typeof err === "object" && "status" in err
      ? Number((err as { status?: unknown }).status)
      : NaN;

  if (
    status === 401 ||
    status === 403 ||
    low.includes("permission_denied") ||
    low.includes("api key not valid") ||
    low.includes("api key") ||
    low.includes("unauthorized")
  ) {
    return new Error(
      "Gemini authentication failed. Check that GEMINI_API_KEY is valid.",
    );
  }
  if (
    status === 429 ||
    low.includes("resource_exhausted") ||
    low.includes("quota") ||
    low.includes("rate limit") ||
    low.includes("too many requests")
  ) {
    return new Error(
      "Gemini rate limit or quota reached. Please wait a moment and try again.",
    );
  }
  if (
    status === 404 ||
    low.includes("not_found") ||
    low.includes("does not exist") ||
    low.includes("model not found")
  ) {
    return new Error(
      "Gemini model is unavailable. Check GEMINI_MODEL / GEMINI_VISION_MODEL.",
    );
  }
  if (low.includes("user location is not supported")) {
    return new Error(
      "Gemini is not available in your current region. Try a supported region or a different API key.",
    );
  }
  if (status === 400 || low.includes("invalid argument")) {
    return new Error(
      "Gemini rejected the request. The input may be too large or malformed.",
    );
  }
  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return new Error("Gemini is temporarily unavailable. Please try again.");
  }
  if (Number.isFinite(status)) {
    return new Error(`Gemini request failed (${status}). ${message.slice(0, 200)}`);
  }
  return new Error(`Gemini request failed: ${message.slice(0, 300)}`);
}

/** Single non-streaming generation. Returns the full text response. */
export async function geminiGenerateText(
  options: GeminiGenerateOptions,
): Promise<string> {
  const model = options.model ?? GEMINI_TEXT_MODEL;
  const timeoutMs = options.timeoutMs ?? 120_000;

  let response;
  try {
    response = await getClient().models.generateContent({
      model,
      contents: toContents(options.messages),
      config: {
        ...buildConfig(options),
        httpOptions: { timeout: timeoutMs },
      },
    });
  } catch (err) {
    throw describeError(err, timeoutMs);
  }

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }
  return text;
}

/**
 * Streaming generation for chat. Yields incremental text chunks, ready to be
 * re-framed by the caller. Errors are classified into user-friendly messages.
 */
export async function geminiGenerateTextStream(
  options: GeminiGenerateOptions,
): Promise<AsyncIterable<string>> {
  const model = options.model ?? GEMINI_TEXT_MODEL;
  const timeoutMs = options.timeoutMs ?? 240_000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let stream: AsyncGenerator<unknown>;
  try {
    stream = await getClient().models.generateContentStream({
      model,
      contents: toContents(options.messages),
      config: {
        ...buildConfig(options),
        abortSignal: controller.signal,
      },
    });
  } catch (err) {
    clearTimeout(timer);
    throw describeError(err, timeoutMs);
  }

  return {
    async *[Symbol.asyncIterator]() {
      try {
        for await (const chunk of stream) {
          const text = (chunk as { text?: string }).text;
          if (text) yield text;
        }
      } catch (err) {
        throw describeError(err, timeoutMs);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
