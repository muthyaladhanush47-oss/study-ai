/**
 * Reusable text chunking for AI pipelines.
 *
 * Splits long documents into ordered, context-safe chunks while preserving
 * logical boundaries (page markers, paragraphs, lines) so summaries and
 * notes keep their structure and page references.
 */

export type ContentChunk = {
  index: number; // 1-based position in the document
  page: number | null; // page number when the chunk started, if known
  text: string;
};

export type ChunkedDocument = {
  chunks: ContentChunk[];
  totalPages: number;
  totalChars: number;
};

// Safe per-chunk size for the configured Gemini model. Gemini 2.5 Flash
// has a 1M-token context, but chunking is about reliability and quality, so we
// stay far below the limit.
export const MAX_CHUNK_CHARS = 12_000;
export const HARD_MAX_CHUNK_CHARS = 16_000;

const PAGE_MARKER = /^=== PAGE\s+(\d+)\s*===\s*$/gm;

type PageSegment = { page: number | null; body: string };

/** Splits OCR text into per-page segments using the "=== PAGE n ===" markers. */
function splitByPages(text: string): PageSegment[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const markers: { page: number; index: number; end: number }[] = [];
  PAGE_MARKER.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PAGE_MARKER.exec(normalized)) !== null) {
    markers.push({
      page: Number(match[1]),
      index: match.index,
      end: match.index + match[0].length,
    });
  }

  if (markers.length === 0) return [{ page: null, body: normalized }];

  const segments: PageSegment[] = [];
  markers.forEach((marker, i) => {
    const start = marker.end;
    const end = i + 1 < markers.length ? markers[i + 1].index : normalized.length;
    segments.push({ page: marker.page, body: normalized.slice(start, end).trim() });
  });
  return segments;
}

/** Breaks a page body into units (paragraphs, or lines when there are none). */
function toUnits(body: string): string[] {
  const byBlank = body
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byBlank.length > 1) return byBlank;
  return body
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Hard-splits an oversized unit by sentences, then by slices. */
function splitOversized(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
  const pieces: string[] = [];
  let acc = "";
  for (const sentence of sentences) {
    if (sentence.length > max) {
      if (acc) {
        pieces.push(acc);
        acc = "";
      }
      for (let i = 0; i < sentence.length; i += max) {
        pieces.push(sentence.slice(i, i + max));
      }
      continue;
    }
    if (acc.length + sentence.length + 1 > max) {
      pieces.push(acc);
      acc = sentence;
    } else {
      acc = acc ? `${acc} ${sentence}` : sentence;
    }
  }
  if (acc) pieces.push(acc);
  return pieces;
}

/**
 * Splits a document into ordered chunks.
 *
 * - Preserves "=== PAGE n ===" boundaries (chunks never span pages).
 * - Prefers paragraph breaks inside a page.
 * - Falls back to sentence-level and hard slicing for oversized blocks.
 */
export function chunkDocument(
  text: string,
  opts: { maxChunkChars?: number } = {},
): ChunkedDocument {
  const maxChunkChars = Math.min(
    opts.maxChunkChars ?? MAX_CHUNK_CHARS,
    HARD_MAX_CHUNK_CHARS,
  );

  const segments = splitByPages(text);
  const chunks: ContentChunk[] = [];
  let index = 1;
  let totalChars = 0;

  for (const segment of segments) {
    const units = toUnits(segment.body);
    let current: string[] = [];
    let currentLen = 0;

    const flush = () => {
      if (current.length === 0) return;
      chunks.push({
        index,
        page: segment.page,
        text: current.join("\n\n").trim(),
      });
      totalChars += chunks[chunks.length - 1].text.length;
      index += 1;
      current = [];
      currentLen = 0;
    };

    for (const unit of units) {
      if (unit.length > maxChunkChars) {
        flush();
        for (const piece of splitOversized(unit, maxChunkChars)) {
          chunks.push({ index, page: segment.page, text: piece });
          totalChars += piece.length;
          index += 1;
        }
        continue;
      }
      if (currentLen > 0 && currentLen + unit.length + 2 > maxChunkChars) {
        flush();
      }
      current.push(unit);
      currentLen += unit.length + 2;
    }
    flush();
  }

  return {
    chunks,
    totalPages: segments.length,
    totalChars,
  };
}
