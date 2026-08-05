import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openRouterStream } from "@/lib/openrouter";
import { truncate } from "@/lib/pdf";
import type { ChatMessage } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300;

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
    .select("id, title")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const { data: content } = await supabase
    .from("document_content")
    .select("content")
    .eq("document_id", documentId)
    .single();

  const notes = content?.content ?? "";
  const context = truncate(notes, 60_000);

  const system = [
    `You are a helpful and encouraging study assistant.`,
    `You are helping a student study the document titled "${doc.title}".`,
    `Answer questions using ONLY the provided study notes.`,
    `If the answer is not in the notes, say so and then give brief general guidance.`,
    `Be concise, clear, and use Markdown formatting (headings, bullets, bold) when it improves readability.`,
    ``,
    `STUDY NOTES:`,
    context || `(No extractable text was found in this PDF.)`,
  ].join("\n");

  const recent = messages.slice(-12).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const upstream = await openRouterStream({
    system,
    messages: recent,
    temperature: 0.7,
    maxTokens: 2048,
  });

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
