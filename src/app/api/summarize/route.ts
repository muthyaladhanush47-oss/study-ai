import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOwnedDocument, logActivity } from "@/lib/ai/document";
import { chunkDocument, MAX_CHUNK_CHARS } from "@/lib/ai/chunk";
import {
  summarizeChunks,
  synthesizeNotes,
} from "@/lib/ai/summarize";
import { logOperation, makeRequestId } from "@/lib/logger";
import type { NotesResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const encoder = new TextEncoder();

function sse(event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function hasRecentSummary(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, documentId: string) {
  return supabase
    .from("study_activities")
    .select("id")
    .eq("user_id", userId)
    .eq("document_id", documentId)
    .eq("type", "summary")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

/**
 * Chunked AI notes generator.
 *
 * Small documents (< MAX_CHUNK_CHARS) are synthesized directly in one safe
 * request. Larger documents are split into ordered chunks (page boundaries
 * preserved), each chunk is digested by the model independently, and the
 * compact digests are then combined into the existing NotesResult structure.
 * Progress is streamed over Server-Sent Events.
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

  const doc = await getOwnedDocument(supabase, user.id, documentId);

  if (!doc) {
    logOperation({
      requestId,
      userId: user.id,
      documentId,
      operation: "summarize.load_document",
      error: "Document not found",
    });
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // ---- OCR-aware status checks (backwards compatible) ----
  const status = doc.processingStatus;
  const stillNeedsOcr =
    doc.textSource === "scanned" && doc.isOcrReady === false;

  if (status === "pending" || (stillNeedsOcr && !status)) {
    return NextResponse.json(
      { error: "Your document is still being processed." },
      { status: 422 },
    );
  }
  if (status === "processing") {
    return NextResponse.json(
      { error: "Your handwritten notes are still being transcribed." },
      { status: 422 },
    );
  }
  if (status === "failed") {
    return NextResponse.json(
      {
        error:
          doc.processingError ||
          "Document processing failed. Please retry OCR.",
      },
      { status: 422 },
    );
  }

  // ---- Empty content guard ----
  if (!doc.content.trim()) {
    return NextResponse.json(
      {
        error:
          "This document does not contain readable text. Please retry OCR or upload a clearer scan.",
      },
      { status: 422 },
    );
  }

  logOperation({
    requestId,
    userId: user.id,
    documentId,
    operation: "summarize.start",
  });

  const chunked = chunkDocument(doc.content);
  const chunks = chunked.chunks;

  // A single, small document can be synthesized directly — one safe request.
  const singleShot =
    chunks.length <= 1 && doc.content.length <= MAX_CHUNK_CHARS;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let result: NotesResult;

        if (singleShot) {
          controller.enqueue(sse("status", { message: "Preparing document…" }));
          controller.enqueue(sse("status", { message: "Creating final study notes…" }));
          result = await synthesizeNotes([], doc.title, doc.content);
        } else {
          controller.enqueue(sse("status", { message: "Preparing document…" }));

          const summaries = await summarizeChunks(
            chunks,
            (fields) =>
              logOperation({
                requestId,
                userId: user.id,
                documentId,
                operation: "summarize.chunk",
                ...fields,
              }),
            (done, total) => {
              controller.enqueue(
                sse("status", {
                  message: `Analyzing section ${done} of ${total}…`,
                }),
              );
            },
          );

          controller.enqueue(sse("status", { message: "Combining notes…" }));
          controller.enqueue(sse("status", { message: "Creating final study notes…" }));

          result = await synthesizeNotes(summaries, doc.title);
        }

        controller.enqueue(sse("result", result));

        // Log one activity per generation (deduped against a very recent one).
        const noteCount = result.notes.length;
        const { data: recent } = await hasRecentSummary(
          supabase,
          user.id,
          documentId,
        );
        if (!recent) {
          await logActivity(supabase, {
            userId: user.id,
            documentId: doc.id,
            type: "summary",
            title: doc.title,
            metadata: { noteCount, source: "ai-notes" },
          });
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "AI summarization failed unexpectedly. Please retry.";
        logOperation({
          requestId,
          userId: user.id,
          documentId,
          operation: "summarize.error",
          error: message,
        });
        controller.enqueue(sse("error", { message }));
      } finally {
        logOperation({
          requestId,
          userId: user.id,
          documentId,
          operation: "summarize.complete",
          chunks: chunks.length,
          durationMs: Date.now() - started,
        });
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
