import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    documentId?: string;
    messages?: ChatMessage[];
  };

  const documentId = body.documentId;
  const messages = body.messages ?? [];

  if (!documentId || messages.length === 0) {
    return NextResponse.json(
      { error: "documentId and messages are required" },
      { status: 400 },
    );
  }

  const { data: doc } = await supabase
    .from("documents")
    .select("id")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const rows = messages.map((m) => ({
    id: crypto.randomUUID(),
    chat_id: documentId,
    user_id: user.id,
    role: m.role,
    content: m.content,
  }));

  const { error } = await supabase.from("chat_messages").insert(rows);

  if (error) {
    return NextResponse.json(
      { error: `Failed to save chat: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
