const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenRouterOptions = {
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
      "X-Title": "Study Assistant",
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

export async function openRouterChat(options: OpenRouterOptions): Promise<string> {
  const {
    system,
    messages,
    temperature = 0.7,
    maxTokens = 4096,
    json = false,
    model,
  } = options;

  const res = await requestOpenRouter({
    model: model ?? DEFAULT_MODEL,
    messages: [
      ...(system ? [{ role: "system" as const, content: system }] : []),
      ...messages,
    ],
    temperature,
    max_tokens: maxTokens,
    ...(json ? { response_format: { type: "json_object" } } : {}),
  });

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned an empty response.");
  }

  return content;
}

export async function openRouterStream(options: OpenRouterOptions) {
  const { system, messages, temperature = 0.7, maxTokens = 4096, model } = options;

  const res = await requestOpenRouter({
    model: model ?? DEFAULT_MODEL,
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
