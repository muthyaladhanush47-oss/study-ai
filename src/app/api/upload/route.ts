import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parsePdf, MAX_STORED_CHARS } from "@/lib/pdf";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_SIZE = 20 * 1024 * 1024;

export async function POST(request: NextRequest) {
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

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { error: "Only PDF files are supported" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File exceeds the 20 MB limit" },
      { status: 413 },
    );
  }

  let text: string;
  let pageCount: number;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parsePdf(buffer);
    text = parsed.text.slice(0, MAX_STORED_CHARS);
    pageCount = parsed.pages;
  } catch {
    return NextResponse.json(
      { error: "Could not read this PDF. It may be corrupted or scanned." },
      { status: 422 },
    );
  }

  const title =
    (formData.get("title") as string)?.trim() ||
    file.name.replace(/\.pdf$/i, "");
  const filePath = `${user.id}/${crypto.randomUUID()}.pdf`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
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
    })
    .select()
    .single();

  if (docError || !document) {
  console.error("DOCUMENT INSERT ERROR");
  console.error(docError);

  await supabase.storage.from("documents").remove([filePath]);

  return NextResponse.json(
    {
      error: docError?.message,
      details: docError,
    },
    { status: 500 }
  );
}

  const { error: contentError } = await supabase
    .from("document_content")
    .insert({ document_id: document.id, content: text });

  if (contentError) {
    await supabase.storage.from("documents").remove([filePath]);
    await supabase.from("documents").delete().eq("id", document.id);
    return NextResponse.json(
      { error: `Failed to index document: ${contentError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ document }, { status: 201 });
}
