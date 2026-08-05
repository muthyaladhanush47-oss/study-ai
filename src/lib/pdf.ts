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

export function truncate(text: string, max = MAX_CONTEXT_CHARS): string {
  if (text.length <= max) return text;
  return text.slice(0, max);
}
