/**
 * Minimal NVIDIA NIM client for TEXT generation.
 *
 * NVIDIA's endpoint (https://integrate.api.nvidia.com/v1) is OpenAI-compatible,
 * so this mirrors a standard chat completions client. It powers all text AI:
 * summaries, flashcards, quizzes, mind maps and the chat tutor.
 *
 * Vision OCR is intentionally NOT handled here — rendered PDF page images go
 * through a separate vision provider (src/lib/ai/vision.ts).
 *
 * Safety: this module never logs the API key, prompts, document contents,
 * base64 image data or any secrets.
 */

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL =
  process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
const NVIDIA_MODEL =
  process.env.NVIDIA_MODEL || "deepseek-ai/deepseek-v4-flash-0731";

export type NvidiaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type NvidiaOptions = {
  system?: string;
  messages: NvidiaMessage[];
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  model?: string;
  timeoutMs?: number;
};

class NvidiaHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function buildBody(
  options: NvidiaOptions,
  stream: boolean,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: options.model ?? NVIDIA_MODEL,
    messages: [
      ...(options.system ? [{ role: "system" as const, content: options.system }] : []),
      ...options.messages,
    ],
    temperature: options.temperature,
    max_tokens: options.maxTokens,
    stream,
  };
  if (options.json) {
    body.response_format = { type: "json_object" };
  }
  return body;
}

function describeError(err: unknown, timeoutMs: number): Error {
  if (err instanceof Error && err.name === "AbortError") {
    return new Error(
      `NVIDIA request timed out after ${timeoutMs} ms. Please try again.`,
    );
  }

  const message = err instanceof Error ? err.message : String(err);
  const low = message.toLowerCase();
  const status =
    err && typeof err === "object" && "status" in err
      ? Number((err as { status?: unknown }).status)
      : NaN;

  // Insufficient credits / billing issues (NVIDIA NIM returns 402, OpenAI-style
  // APIs sometimes use 429 with an insufficient_quota message).
  if (
    status === 402 ||
    low.includes("insufficient") ||
    low.includes("credits") ||
    low.includes("billing") ||
    low.includes("payment")
  ) {
    return new Error(
      "NVIDIA credits are insufficient. Top up your NVIDIA NIM account or check NVIDIA_API_KEY.",
    );
  }
  if (
    status === 401 ||
    status === 403 ||
    low.includes("invalid api key") ||
    low.includes("authentication") ||
    low.includes("unauthorized")
  ) {
    return new Error(
      "NVIDIA authentication failed. Check that NVIDIA_API_KEY is valid.",
    );
  }
  if (
    status === 429 ||
    low.includes("rate limit") ||
    low.includes("too many requests") ||
    low.includes("quota")
  ) {
    return new Error(
      "NVIDIA rate limit reached. Please wait a moment and try again.",
    );
  }
  if (
    status === 404 ||
    low.includes("not_found") ||
    low.includes("model not found") ||
    low.includes("does not exist")
  ) {
    return new Error(
      "The NVIDIA model is unavailable. Check NVIDIA_MODEL.",
    );
  }
  // NVIDIA retires models over time. A 410 Gone (or an explicit
  // end-of-life / retired / no-longer-available message) means the configured
  // model was decommissioned, not that the request was malformed.
  if (
    status === 410 ||
    low.includes("end of life") ||
    low.includes("reached its end of life") ||
    low.includes("retired") ||
    low.includes("no longer available") ||
    low.includes("deprecated") ||
    low.includes("decommissioned")
  ) {
    return new Error(
      "The configured NVIDIA model is no longer available; it has been retired by NVIDIA. Update NVIDIA_MODEL to a currently supported model.",
    );
  }
  if (status === 400 || low.includes("invalid argument")) {
    return new Error(
      "NVIDIA rejected the request. The input may be too large or malformed.",
    );
  }
  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return new Error("NVIDIA is temporarily unavailable. Please try again.");
  }
  if (Number.isFinite(status)) {
    return new Error(
      `NVIDIA request failed (${status}). ${message.slice(0, 200)}`,
    );
  }
  return new Error(`NVIDIA request failed: ${message.slice(0, 300)}`);
}

async function requestNvidia(
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<Response> {
  if (!NVIDIA_API_KEY) {
    throw new Error(
      "NVIDIA_API_KEY is not configured. Add it to your environment (.env.local).",
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(
        `NVIDIA request timed out after ${timeoutMs} ms. Please try again.`,
      );
    }
    throw describeError(err, timeoutMs);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      // ignore — the status alone is enough to classify the error
    }
    throw describeError(new NvidiaHttpError(res.status, detail), timeoutMs);
  }

  return res;
}

/** Single non-streaming text generation. Returns the full response text. */
export async function nvidiaChat(options: NvidiaOptions): Promise<string> {
  const timeoutMs = options.timeoutMs ?? 120_000;

  const res = await requestNvidia(buildBody(options, false), timeoutMs);

  const data = (await res.json()) as {
    choices?: { message?: { content?: string | unknown } }[];
  };

  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("NVIDIA returned an empty response.");
  }
  return content;
}

/**
 * Streaming text generation for chat. Returns the upstream OpenAI-compatible
 * SSE stream (data frames + `data: [DONE]`) so callers can pass it through
 * directly to the browser.
 */
export async function nvidiaStream(
  options: NvidiaOptions,
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? 120_000;
  return requestNvidia(buildBody(options, true), timeoutMs);
}
