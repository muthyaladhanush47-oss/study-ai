import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderPdfPages } from "@/lib/ocr";
import { transcribePages } from "@/lib/ai/vision";
import { MAX_STORED_CHARS } from "@/lib/pdf";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PAGES = 40;

export async function POST(request: NextRequest) {
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
    .select("id, title, file_path, page_count, is_ocr_ready")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (document.is_ocr_ready) {
    return NextResponse.json({
      message: "Already processed",
      pageCount: document.page_count,
    });
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from("documents")
    .download(document.file_path);

  if (downloadError || !file) {
    return NextResponse.json(
      { error: `Could not download the file: ${downloadError?.message ?? "unknown"}` },
      { status: 500 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const ext = "." + document.file_path.toLowerCase().split(".").pop();
  const isImage = ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".webp";

  let pages: Buffer[];
  if (isImage) {
    pages = [buffer];
  } else {
    pages = await renderPdfPages(buffer, {
      scale: 2,
      maxPages: MAX_PAGES,
    });
  }

  if (pages.length === 0) {
    return NextResponse.json(
      { error: "Could not render any pages from this file." },
      { status: 422 },
    );
  }

  const mime = isImage
    ? ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".webp"
        ? "image/webp"
        : "image/png"
    : "image/png";

  const transcriptions = await transcribePages(
    pages.map((image, index) => ({ page: index + 1, image, mime })),
  );

  const text = transcriptions
    .map((entry) => entry.text.trim())
    .filter(Boolean)
    .join("\n\n")
    .slice(0, MAX_STORED_CHARS);

  await supabase
    .from("document_content")
    .upsert(
      { document_id: document.id, content: text },
      { onConflict: "document_id" },
    );

  await supabase
    .from("documents")
    .update({ text_source: "ocr", is_ocr_ready: true })
    .eq("id", document.id);

  return NextResponse.json({
    pageCount: pages.length,
    textLength: text.length,
    transcriptions,
  });
}
