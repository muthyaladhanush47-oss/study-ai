import { pdf, type Pdf } from "pdf-to-img";
import { createCanvas, loadImage } from "@napi-rs/canvas";

export type PdfHandle = { document: Pdf };

/**
 * Opens a PDF and returns a handle that can render one page at a time,
 * so a large handwritten PDF never has all its pages held in memory.
 */
export async function openPdf(
  buffer: Buffer,
  opts: { scale?: number } = {},
): Promise<PdfHandle> {
  const document = await pdf(buffer, { scale: opts.scale ?? 2 });
  return { document };
}

/** Renders a single page of an open PDF to a PNG buffer. */
export async function renderPdfPage(
  handle: PdfHandle,
  pageNumber: number,
): Promise<Buffer> {
  return Buffer.from(await handle.document.getPage(pageNumber));
}

export function pdfPageCount(handle: PdfHandle): number {
  return handle.document.length;
}

export async function destroyPdf(handle: PdfHandle): Promise<void> {
  await handle.document.destroy().catch(() => {});
}

/**
 * Re-encodes a rendered PNG page as a downscaled JPEG. Handwriting stays
 * readable at ~2400px on the long edge while the vision payload drops from
 * ~2–5 MB to a few hundred KB, so each Gemini vision call is smaller and faster.
 */
export async function compressPageImage(
  png: Buffer,
  opts: { maxDim?: number; quality?: number } = {},
): Promise<{ data: Buffer; mime: string }> {
  const maxDim = opts.maxDim ?? 2400;
  const quality = opts.quality ?? 88;

  const img = await loadImage(png);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  return {
    data: canvas.toBuffer("image/jpeg", quality),
    mime: "image/jpeg",
  };
}
