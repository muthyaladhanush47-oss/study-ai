import { pdf } from "pdf-to-img";

/**
 * Renders PDF pages to PNG buffers on the server.
 * Uses pdf-to-img (pdfjs-dist + @napi-rs/canvas), no browser required.
 */
export async function renderPdfPages(
  buffer: Buffer,
  opts: { scale?: number; maxPages?: number } = {},
): Promise<Buffer[]> {
  const { scale = 2, maxPages = 40 } = opts;

  const doc = await pdf(buffer, { scale });
  const pages: Buffer[] = [];

  try {
    for await (const image of doc) {
      pages.push(image);
      if (pages.length >= maxPages) break;
    }
  } finally {
    await doc.destroy().catch(() => {});
  }

  return pages;
}
