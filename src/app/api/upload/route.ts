import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parsePdf, isLikelyScanned, MAX_STORED_CHARS } from "@/lib/pdf";
import { logOperation, makeRequestId } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_SIZE = 100 * 1024 * 1024;

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const IMAGE_CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

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

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = "." + (file.name.toLowerCase().split(".").pop() ?? "");
  const isImage = IMAGE_EXTENSIONS.has(ext);
  const isPdf = ext === ".pdf";

  // Validate by extension AND declared MIME type (files are untrusted input).
  const declaredType = (file.type ?? "").toLowerCase();
  if (!isPdf && !isImage) {
    return NextResponse.json(
      {
        error:
          "Unsupported file type. Upload a PDF, JPG, JPEG, PNG or WebP file.",
      },
      { status: 400 },
    );
  }
  if (isPdf && declaredType && !declaredType.includes("pdf")) {
    return NextResponse.json(
      { error: "The file's MIME type does not match a PDF." },
      { status: 400 },
    );
  }
  if (isImage && declaredType && !declaredType.startsWith("image/")) {
    return NextResponse.json(
      { error: "The file's MIME type does not match an image." },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Upload failed: file exceeds the 100 MB server limit." },
      { status: 413 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      { error: "Upload failed: the file is empty." },
      { status: 422 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let text = "";
  let pageCount = 0;
  let needsOcr = true;
  let textSource = "scanned";

  if (isPdf) {
    try {
      const parsed = await parsePdf(buffer);
      text = parsed.text.slice(0, MAX_STORED_CHARS);
      pageCount = parsed.pages;
    } catch {
      logOperation({
        requestId,
        userId: user.id,
        operation: "upload.parse_pdf",
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
    pageCount = 1;
    // A single photo of handwritten notes always needs OCR.
    needsOcr = true;
    textSource = "scanned";
  }

  const title =
    (formData.get("title") as string)?.trim() ||
    file.name.replace(/\.(pdf|jpe?g|png|webp)$/i, "");
  const filePath = `${user.id}/${crypto.randomUUID()}${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, buffer, {
      contentType: isImage ? IMAGE_CONTENT_TYPES[ext] : "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    logOperation({
      requestId,
      userId: user.id,
      operation: "upload.storage",
      error: uploadError.message,
    });
    return NextResponse.json(
      { error: `Storage upload failed: ${uploadError.message}` },
      { status: 500 },
    );
  }

  const { data: document, error: docError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      title,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
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
      operation: "upload.insert_document",
      error: docError?.message ?? "Failed to create document.",
    });
    await supabase.storage.from("documents").remove([filePath]);
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
      operation: "upload.insert_content",
      error: contentError.message,
    });
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
    operation: "upload.complete",
    durationMs: Date.now() - started,
  });

  return NextResponse.json({ document, needsOcr }, { status: 201 });
}
