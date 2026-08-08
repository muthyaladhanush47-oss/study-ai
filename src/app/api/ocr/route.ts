import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  compressPageImage,
  destroyPdf,
  openPdf,
  pdfPageCount,
  renderPdfPage,
  type PdfHandle,
} from "@/lib/ocr";
import { transcribePage, VisionApiError } from "@/lib/ai/vision";
import { MAX_STORED_CHARS } from "@/lib/pdf";
import { logOperation, makeRequestId } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 300;

// High safety valve. Per-page processing keeps memory bounded regardless of
// page count; this only guards against pathologically huge documents.
const MAX_PAGES = 500;

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const encoder = new TextEncoder();

function sse(event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/** Extracts the set of fully-transcribed pages from stored content. */
function completedPagesFromContent(content: string): Set<number> {
  const done = new Set<number>();
  const regex = /^=== PAGE\s+(\d+)\s*===/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    done.add(Number(match[1]));
  }
  return done;
}

async function markFailed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  documentId: string,
  message: string,
) {
  try {
    await supabase
      .from("documents")
      .update({ processing_status: "failed", processing_error: message })
      .eq("id", documentId);
  } catch {
    // Best-effort: never let a status write mask the original error.
  }
}

/**
 * Transcribes a scanned/handwritten document page by page and streams
 * progress over Server-Sent Events.
 *
 * Memory-bounded: pages are rendered ONE at a time (render → compress →
 * vision → save → release) so a 42 MB scanned PDF never has all of its
 * images in RAM. Every successfully transcribed page is written to
 * document_content immediately, so a timeout or failure never loses work
 * and Retry resumes from the first un-transcribed page.
 */
export async function POST(request: NextRequest) {
  const requestId = makeRequestId();
  const started = Date.now();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let documentId: string;
  try {
    const body = (await request.json()) as { documentId?: unknown };
    if (typeof body.documentId !== "string" || !body.documentId.trim()) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 },
      );
    }
    documentId = body.documentId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { data: document } = await supabase
    .from("documents")
    .select(
      "id, title, file_path, page_count, is_ocr_ready, processing_status, processing_error",
    )
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();

  if (!document) {
    logOperation({
      requestId,
      userId: user.id,
      operation: "ocr.load_document",
      error: "Document not found",
    });
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (document.is_ocr_ready) {
    return NextResponse.json({
      message: "Already processed",
      pageCount: document.page_count,
    });
  }

  logOperation({
    requestId,
    userId: user.id,
    documentId,
    operation: "ocr.start",
  });

  // Mark as processing; stale partial content from a previous run is kept so
  // Retry resumes from the first un-transcribed page instead of re-doing work.
  await supabase
    .from("documents")
    .update({
      processing_status: "processing",
      processing_error: null,
    })
    .eq("id", documentId);

  // Ensure a content row exists so per-page updates always land.
  const { data: existingContent } = await supabase
    .from("document_content")
    .select("content")
    .eq("document_id", documentId)
    .maybeSingle();

  if (!existingContent) {
    const { error: insertError } = await supabase
      .from("document_content")
      .insert({ document_id: documentId, content: "" });
    if (insertError) {
      const message = `OCR failed while preparing storage: ${insertError.message}`;
      await markFailed(supabase, documentId, message);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Download the file once (function → Supabase Storage, never back to the
  // browser). Releasing the original PDF bytes here keeps the whole OCR run
  // far below Vercel's function memory limit.
  const { data: file, error: downloadError } = await supabase.storage
    .from("documents")
    .download(document.file_path);

  if (downloadError || !file) {
    const message = `OCR failed while downloading the file from Storage: ${downloadError?.message ?? "unknown"}`;
    await markFailed(supabase, documentId, message);
    logOperation({
      requestId,
      userId: user.id,
      documentId,
      operation: "ocr.download",
      stage: "storage_download",
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch (err) {
    const message = `OCR failed while reading the downloaded file: ${err instanceof Error ? err.message : "unknown"}`;
    await markFailed(supabase, documentId, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  logOperation({
    requestId,
    userId: user.id,
    documentId,
    operation: "ocr.download",
    stage: "storage_download",
    fileSize: buffer.length,
  });

  const ext = "." + (document.file_path.toLowerCase().split(".").pop() ?? "");
  const isImage = IMAGE_EXTENSIONS.has(ext);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let handle: PdfHandle | null = null;
      try {
        controller.enqueue(
          sse("status", {
            phase: "reading",
            message: "Reading your handwritten notes…",
          }),
        );

        const existing = existingContent?.content ?? "";
        const completed = completedPagesFromContent(existing);
        let full = existing.slice(0, MAX_STORED_CHARS);

        let totalPages: number;
        if (isImage) {
          totalPages = 1;
        } else {
          handle = await openPdf(buffer, { scale: 3 });
          totalPages = pdfPageCount(handle);
          logOperation({
            requestId,
            userId: user.id,
            documentId,
            operation: "ocr.render",
            stage: "open",
            totalPages,
            fileSize: buffer.length,
          });
          if (totalPages > MAX_PAGES) {
            throw new Error(
              `This PDF has ${totalPages} pages; the maximum supported is ${MAX_PAGES}.`,
            );
          }
          if (totalPages === 0) {
            throw new Error(
              "OCR failed: the PDF contains no renderable pages.",
            );
          }
        }

        for (let i = 1; i <= totalPages; i++) {
          controller.enqueue(
            sse("progress", {
              page: i,
              total: totalPages,
              message: `Transcribing page ${i} of ${totalPages}…`,
            }),
          );

          if (completed.has(i)) {
            logOperation({
              requestId,
              userId: user.id,
              documentId,
              operation: "ocr.page_skip",
              stage: "resume",
              page: i,
              totalPages,
            });
            continue;
          }

          // One page at a time: render → compress → vision → save → release.
          let text: string;
          try {
            const raw = isImage ? buffer : await renderPdfPage(handle!, i);
            const { data: image, mime } = await compressPageImage(raw);
            text = await transcribePage({
              page: i,
              image,
              mime,
              onRetry: ({ attempt, delayMs }) => {
                logOperation({
                  requestId,
                  userId: user.id,
                  documentId,
                  operation: "ocr.rate_limit_wait",
                  stage: "transcribe",
                  page: i,
                  totalPages,
                  attempt,
                  delayMs,
                });
                controller.enqueue(
                  sse("waiting", {
                    page: i,
                    total: totalPages,
                    attempt,
                    message: "Gemini is temporarily rate-limiting OCR. Retrying…",
                  }),
                );
              },
            });
          } catch (err) {
            // Rate-limit and quota errors are already complete, user-facing
            // messages — let the outer catch format them. Everything else is
            // page-specific and keeps the existing wrapping.
            if (err instanceof VisionApiError) throw err;
            const detail =
              err instanceof Error ? err.message : "unknown error";
            throw new Error(`OCR failed on page ${i}: ${detail}`);
          }

          if (text.trim()) {
            full = `${full}\n\n=== PAGE ${i} ===\n${text.trim()}`.slice(
              0,
              MAX_STORED_CHARS,
            );
            const { error: saveError } = await supabase
              .from("document_content")
              .update({
                content: full,
                updated_at: new Date().toISOString(),
              })
              .eq("document_id", documentId);
            if (saveError) {
              throw new Error(
                `OCR failed while saving page ${i}: ${saveError.message}`,
              );
            }
          }

          logOperation({
            requestId,
            userId: user.id,
            documentId,
            operation: "ocr.page_done",
            stage: "transcribe",
            page: i,
            totalPages,
            durationMs: Date.now() - started,
          });
        }

        const { error: updateError } = await supabase
          .from("documents")
          .update({
            text_source: "ocr",
            is_ocr_ready: true,
            processing_status: "ready",
            processing_error: null,
            page_count: totalPages,
          })
          .eq("id", documentId);

        if (updateError) {
          throw new Error(
            `OCR finished but could not save the result: ${updateError.message}`,
          );
        }

        controller.enqueue(
          sse("done", {
            pageCount: totalPages,
            textLength: full.length,
          }),
        );
        logOperation({
          requestId,
          userId: user.id,
          documentId,
          operation: "ocr.complete",
          stage: "complete",
          totalPages,
          durationMs: Date.now() - started,
        });
      } catch (err) {
        // Quota/rate-limit exhaustion are already clean, complete sentences;
        // keep them verbatim. Everything else keeps the existing wrapping.
        const message =
          err instanceof VisionApiError
            ? err.message
            : err instanceof Error
              ? `OCR failed: ${err.message}`
              : "OCR failed unexpectedly.";
        await markFailed(supabase, documentId, message);
        logOperation({
          requestId,
          userId: user.id,
          documentId,
          operation: "ocr.error",
          error: message,
          durationMs: Date.now() - started,
        });
        controller.enqueue(sse("error", { message }));
      } finally {
        if (handle) await destroyPdf(handle);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
