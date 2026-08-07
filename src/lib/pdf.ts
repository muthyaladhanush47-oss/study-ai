import pdfParse from "pdf-parse";

export type ParsedPdf = {
  text: string;
  pages: number;
};

/**
 * Extracts raw text and page count from a PDF buffer.
 */
export async function parsePdf(buffer: Buffer): Promise<ParsedPdf> {
  const data = await pdfParse(buffer);
  return {
    text: data.text ?? "",
    pages: data.numpages ?? 0,
  };
}

export const MAX_STORED_CHARS = 500_000;
export const MAX_CONTEXT_CHARS = 60_000;

/**
 * A PDF is "scanned" when there is no meaningful extractable text layer,
 * i.e. it contains handwriting or is a scan of a printed page.
 */
export function isLikelyScanned(text: string, pageCount: number): boolean {
  const clean = text.trim();
  if (pageCount <= 0) return clean.length < 300;
  return clean.length < 300 || clean.length / pageCount < 80;
}

export function truncate(text: string, max = MAX_CONTEXT_CHARS): string {
  if (text.length <= max) return text;
  return text.slice(0, max);
}
