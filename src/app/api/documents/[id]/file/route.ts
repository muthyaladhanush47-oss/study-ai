import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: document } = await supabase
    .from("documents")
    .select("id, file_path, file_name, file_size")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const { data: file } = await supabase.storage
    .from("documents")
    .download(document.file_path);

  if (!file) {
    return NextResponse.json(
      { error: "Could not download the file." },
      { status: 500 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${document.file_name}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, max-age=300",
    },
  });
}
