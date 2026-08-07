const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Powerful, cheap, 1M-context workhorse — great for summaries & chat.
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
// Vision-capable model used to read handwriting from page images.
const VISION_MODEL = process.env.OPENROUTER_VISION_MODEL || "google/gemini-2.5-flash";

export type OpenRouterContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string | OpenRouterContentPart[];
};

export type OpenRouterOptions = {
  system?: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  model?: string;
};

async function requestOpenRouter(
  body: Record<string, unknown>,
  signal?: AbortSignal,
) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "X-Title": "StudyAI",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      // ignore
    }
    throw new Error(
      `OpenRouter request failed (${res.status}): ${detail.slice(0, 300)}`,
    );
  }

  return res;
}

function resolveModel(overrides?: string): string {
  return overrides ?? DEFAULT_MODEL;
}

export async function openRouterChat(
  options: OpenRouterOptions,
): Promise<string> {
  const {
    system,
    messages,
    temperature = 0.7,
    maxTokens = 8192,
    json = false,
    model,
  } = options;

  const res = await requestOpenRouter({
    model: resolveModel(model),
    messages: [
      ...(system ? [{ role: "system" as const, content: system }] : []),
      ...messages,
    ],
    temperature,
    max_tokens: maxTokens,
    ...(json ? { response_format: { type: "json_object" } } : {}),
  });

  const data = (await res.json()) as {
    choices?: { message?: { content?: string | OpenRouterContentPart[] } }[];
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned an empty response.");
  }

  if (typeof content !== "string") {
    throw new Error("OpenRouter returned a non-text response.");
  }

  return content;
}

export async function openRouterStream(options: OpenRouterOptions) {
  const {
    system,
    messages,
    temperature = 0.7,
    maxTokens = 2048,
    model,
  } = options;

  const res = await requestOpenRouter({
    model: resolveModel(model),
    messages: [
      ...(system ? [{ role: "system" as const, content: system }] : []),
      ...messages,
    ],
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  return res;
}
