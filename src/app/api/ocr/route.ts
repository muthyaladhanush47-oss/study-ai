import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderPdfPages } from "@/lib/ocr";
import { transcribePage } from "@/lib/ai/vision";
import { MAX_STORED_CHARS } from "@/lib/pdf";
import { logOperation, makeRequestId } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PAGES = 40;

const encoder = new TextEncoder();

function sse(event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * Transcribes a scanned/handwritten document page by page and streams
 * progress over Server-Sent Events so the UI can show
 * "Transcribing page 2 of 12...".
 *
 * The transcription for each page is appended to document_content as it
 * finishes, so partial progress survives a timeout or a network drop.
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

  const body = (await request.json()) as { documentId?: string };
  const documentId = body.documentId;

  if (!documentId) {
    return NextResponse.json(
      { error: "documentId is required" },
      { status: 400 },
    );
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

  // Mark as processing and clear any stale partial content from a failed run.
  await supabase
    .from("documents")
    .update({
      processing_status: "processing",
      processing_error: null,
    })
    .eq("id", documentId);

  await supabase
    .from("document_content")
    .upsert({ document_id: documentId, content: "" }, { onConflict: "document_id" });

  const { data: file, error: downloadError } = await supabase.storage
    .from("documents")
    .download(document.file_path);

  if (downloadError || !file) {
    const message = `Could not download the file: ${downloadError?.message ?? "unknown"}`;
    await supabase
      .from("documents")
      .update({ processing_status: "failed", processing_error: message })
      .eq("id", documentId);
    logOperation({
      requestId,
      userId: user.id,
      documentId,
      operation: "ocr.download",
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const ext = "." + document.file_path.toLowerCase().split(".").pop();
  const isImage =
    ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".webp";

  let pages: Buffer[];
  try {
    if (isImage) {
      pages = [buffer];
    } else {
      pages = await renderPdfPages(buffer, {
        scale: 2,
        maxPages: MAX_PAGES,
      });
    }
  } catch (err) {
    const message =
      err instanceof Error
        ? `Could not render the PDF pages: ${err.message}`
        : "Could not render the PDF pages.";
    await supabase
      .from("documents")
      .update({ processing_status: "failed", processing_error: message })
      .eq("id", documentId);
    logOperation({
      requestId,
      userId: user.id,
      documentId,
      operation: "ocr.render",
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 422 });
  }

  if (pages.length === 0) {
    const message = "Could not render any pages from this file.";
    await supabase
      .from("documents")
      .update({ processing_status: "failed", processing_error: message })
      .eq("id", documentId);
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const mime = isImage
    ? ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".webp"
        ? "image/webp"
        : "image/png"
    : "image/png";

  let stream: ReadableStream<Uint8Array>;

  stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          sse("status", { phase: "reading", message: "Reading your handwritten notes…" }),
        );

        let full = "";
        for (let i = 0; i < pages.length; i++) {
          const pageNumber = i + 1;
          controller.enqueue(
            sse("progress", {
              page: pageNumber,
              total: pages.length,
              message: `Transcribing page ${pageNumber} of ${pages.length}…`,
            }),
          );

          let text: string;
          try {
            text = await transcribePage({
              page: pageNumber,
              image: pages[i],
              mime,
            });
          } catch (err) {
            const message =
              err instanceof Error
                ? `OCR failed: unable to process page ${pageNumber}: ${err.message}`
                : `OCR failed: unable to process page ${pageNumber}.`;
            await supabase
              .from("documents")
              .update({
                processing_status: "failed",
                processing_error: message,
              })
              .eq("id", documentId);
            logOperation({
              requestId,
              userId: user.id,
              documentId,
              operation: "ocr.transcribe_page",
              error: message,
            });
            controller.enqueue(sse("error", { message }));
            return;
          }

          // Persist incrementally so partial progress is never lost.
          if (text.trim()) {
            full = `${full}\n\n=== PAGE ${pageNumber} ===\n${text.trim()}`;
            await supabase
              .from("document_content")
              .update({
                content: full.slice(0, MAX_STORED_CHARS),
                updated_at: new Date().toISOString(),
              })
              .eq("document_id", documentId);
          }

          logOperation({
            requestId,
            userId: user.id,
            documentId,
            operation: "ocr.page_done",
            durationMs: Date.now() - started,
          });
        }

        const finalText = full.slice(0, MAX_STORED_CHARS);
        const { error: updateError } = await supabase
          .from("documents")
          .update({
            text_source: "ocr",
            is_ocr_ready: true,
            processing_status: "ready",
            processing_error: null,
            page_count: pages.length,
          })
          .eq("id", documentId);

        if (updateError) {
          const message = `OCR finished but could not save the result: ${updateError.message}`;
          logOperation({
            requestId,
            userId: user.id,
            documentId,
            operation: "ocr.finalize",
            error: message,
          });
          controller.enqueue(sse("error", { message }));
          return;
        }

        controller.enqueue(
          sse("done", {
            pageCount: pages.length,
            textLength: finalText.length,
          }),
        );
        logOperation({
          requestId,
          userId: user.id,
          documentId,
          operation: "ocr.complete",
          durationMs: Date.now() - started,
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? `OCR failed: ${err.message}`
            : "OCR failed unexpectedly.";
        await supabase
          .from("documents")
          .update({ processing_status: "failed", processing_error: message })
          .eq("id", documentId);
        logOperation({
          requestId,
          userId: user.id,
          documentId,
          operation: "ocr.error",
          error: message,
        });
        controller.enqueue(sse("error", { message }));
      } finally {
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
