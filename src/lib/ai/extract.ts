/**
 * Robustly extracts a JSON payload from an LLM response that may contain
 * markdown code fences, prose, or trailing text.
 */
export function extractJson<T = unknown>(text: string): T {
  let candidate = text.trim();

  const fence = candidate.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) candidate = fence[1].trim();

  try {
    return JSON.parse(candidate) as T;
  } catch {
    // fall through
  }

  const start = candidate.search(/[[{]/);
  if (start >= 0) {
    const sliced = candidate.slice(start);
    try {
      return JSON.parse(sliced) as T;
    } catch {
      // fall through
    }
  }

  throw new Error("Could not parse AI response as JSON.");
}
