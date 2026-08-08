import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parsePdf, isLikelyScanned, MAX_STORED_CHARS } from "@/lib/pdf";
import { logOperation, makeRequestId } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_SIZE = 100 * 1024 * 1024;
const MAX_FILE_NAME = 255;

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// The client uploads files directly to Storage under
// <user uuid>/<random uuid>.<ext> and then registers them here with JSON
// metadata only (so the Vercel function never receives the file bytes).
const FILE_PATH_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|jpe?g|png|webp)$/i;

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

  let body: {
    filePath?: unknown;
    fileName?: unknown;
    fileSize?: unknown;
    contentType?: unknown;
    title?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const filePath =
    typeof body.filePath === "string" ? body.filePath.trim() : "";
  const fileName =
    typeof body.fileName === "string" ? body.fileName.trim() : "";
  const fileSize =
    typeof body.fileSize === "number" && Number.isFinite(body.fileSize)
      ? body.fileSize
      : NaN;

  if (!filePath) {
    return NextResponse.json(
      { error: "filePath is required." },
      { status: 400 },
    );
  }
  if (!fileName) {
    return NextResponse.json(
      { error: "fileName is required." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(fileSize)) {
    return NextResponse.json(
      { error: "fileSize is required." },
      { status: 400 },
    );
  }

  if (fileName.length > MAX_FILE_NAME) {
    return NextResponse.json(
      { error: "File name is too long." },
      { status: 400 },
    );
  }

  // Reject anything that isn't exactly <user uuid>/<random uuid>.<ext>.
  if (!FILE_PATH_RE.test(filePath)) {
    return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
  }
  if (!filePath.startsWith(`${user.id}/`)) {
    return NextResponse.json(
      { error: "Unauthorized file path." },
      { status: 403 },
    );
  }

  if (fileSize <= 0) {
    return NextResponse.json(
      { error: "Upload failed: the file is empty." },
      { status: 422 },
    );
  }
  if (fileSize > MAX_SIZE) {
    return NextResponse.json(
      { error: "Upload failed: file exceeds the 100 MB server limit." },
      { status: 413 },
    );
  }

  const ext = "." + filePath.toLowerCase().split(".").pop();
  const isImage = IMAGE_EXTENSIONS.has(ext);
  const isPdf = ext === ".pdf";

  if (!isPdf && !isImage) {
    return NextResponse.json(
      {
        error:
          "Unsupported file type. Upload a PDF, JPG, JPEG, PNG or WebP file.",
      },
      { status: 400 },
    );
  }

  // Validate the declared MIME type against the extension (files are
  // untrusted input), matching the behaviour of the legacy upload route.
  const contentType =
    typeof body.contentType === "string" ? body.contentType.trim() : "";
  const declaredType = contentType.toLowerCase();
  if (declaredType) {
    if (isPdf && !declaredType.includes("pdf")) {
      return NextResponse.json(
        { error: "The file's MIME type does not match a PDF." },
        { status: 400 },
      );
    }
    if (isImage && !declaredType.startsWith("image/")) {
      return NextResponse.json(
        { error: "The file's MIME type does not match an image." },
        { status: 400 },
      );
    }
  }

  logOperation({
    requestId,
    userId: user.id,
    operation: "create.upload_received",
    fileSize,
  });

  // Verify the object actually landed in Storage and that its size matches
  // what the client reported (integrity check without trusting the client).
  const { data: info, error: infoError } = await supabase.storage
    .from("documents")
    .info(filePath);

  if (infoError || !info) {
    logOperation({
      requestId,
      userId: user.id,
      operation: "create.storage_info",
      error: infoError?.message ?? "Object not found",
    });
    return NextResponse.json(
      { error: "The uploaded file was not found. Please upload it again." },
      { status: 422 },
    );
  }

  const storedSize =
    info.size ?? (info as { metadata?: { size?: number } }).metadata?.size;
  if (typeof storedSize === "number" && storedSize !== fileSize) {
    logOperation({
      requestId,
      userId: user.id,
      operation: "create.size_mismatch",
      error: `Client reported ${fileSize} bytes but storage has ${storedSize}.`,
    });
    return NextResponse.json(
      { error: "Upload verification failed. Please upload the file again." },
      { status: 422 },
    );
  }

  // Detect scanned vs typed PDFs by downloading the file from Storage and
  // reading its text layer. The download happens function-to-Storage only;
  // the response never carries the file back to the browser.
  let text = "";
  let pageCount = 0;
  let needsOcr = true;
  let textSource = "scanned";

  if (isPdf) {
    const { data: file, error: downloadError } = await supabase.storage
      .from("documents")
      .download(filePath);

    if (downloadError || !file) {
      const message = `Could not read the uploaded PDF: ${downloadError?.message ?? "unknown"}`;
      logOperation({
        requestId,
        userId: user.id,
        operation: "create.download",
        error: message,
      });
      return NextResponse.json(
        { error: "Could not read the uploaded PDF. Please upload it again." },
        { status: 422 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      const parsed = await parsePdf(buffer);
      text = parsed.text.slice(0, MAX_STORED_CHARS);
      pageCount = parsed.pages;
    } catch {
      logOperation({
        requestId,
        userId: user.id,
        operation: "create.parse_pdf",
        error: "Could not read this PDF; it may be corrupted.",
      });
      return NextResponse.json(
        { error: "Could not read this PDF. It may be corrupted or encrypted." },
        { status: 422 },
      );
    }
    needsOcr = isLikelyScanned(text, pageCount);
    textSource = needsOcr ? "scanned" : "pdf";
  } else {
    // A single photo of handwritten notes always needs OCR.
    pageCount = 1;
    needsOcr = true;
    textSource = "scanned";
  }

  const rawTitle = typeof body.title === "string" ? body.title.trim() : "";
  const title =
    rawTitle || fileName.replace(/\.(pdf|jpe?g|png|webp)$/i, "");

  const { data: document, error: docError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      title,
      file_name: fileName,
      file_path: filePath,
      file_size: fileSize,
      page_count: pageCount,
      text_source: textSource,
      is_ocr_ready: !needsOcr,
      processing_status: needsOcr ? "pending" : "ready",
    })
    .select()
    .single();

  if (docError || !document) {
    logOperation({
      requestId,
      userId: user.id,
      operation: "create.insert_document",
      error: docError?.message ?? "Failed to create document.",
    });
    // Leave the storage object untouched: we have no proof it belongs to
    // this request, so never risk deleting an existing file. The client
    // cleans up the object it just uploaded on failure.
    return NextResponse.json(
      { error: docError?.message ?? "Failed to create the document record." },
      { status: 500 },
    );
  }

  const { error: contentError } = await supabase
    .from("document_content")
    .insert({ document_id: document.id, content: needsOcr ? "" : text });

  if (contentError) {
    logOperation({
      requestId,
      userId: user.id,
      documentId: document.id,
      operation: "create.insert_content",
      error: contentError.message,
    });
    // The document row we just created references this exact path, so it is
    // safe to remove both the row and the object it points at.
    await supabase.storage.from("documents").remove([filePath]);
    await supabase.from("documents").delete().eq("id", document.id);
    return NextResponse.json(
      { error: `Failed to index the document: ${contentError.message}` },
      { status: 500 },
    );
  }

  logOperation({
    requestId,
    userId: user.id,
    documentId: document.id,
    operation: "create.complete",
    durationMs: Date.now() - started,
  });

  return NextResponse.json({ document, needsOcr }, { status: 201 });
}
