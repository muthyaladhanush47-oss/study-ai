import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nvidiaStream, type NvidiaMessage } from "@/lib/nvidia";
import { truncate } from "@/lib/pdf";
import { getOwnedDocument, getProfile, buildStudyContext, logActivity } from "@/lib/ai/document";
import type { ChatMessage } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_HISTORY = 50;

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
  const clientMessages = body.messages ?? [];

  if (!documentId || clientMessages.length === 0) {
    return NextResponse.json(
      { error: "documentId and messages are required" },
      { status: 400 },
    );
  }

  const doc = await getOwnedDocument(supabase, user.id, documentId);
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (!doc.content.trim()) {
    if (doc.textSource === "scanned" || doc.isOcrReady === false) {
      return NextResponse.json(
        { error: "This document still needs OCR. Please run OCR first." },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: "This PDF has no extractable text." },
      { status: 422 },
    );
  }

  // ---- Memory: load previous conversation from the database ----
  const { data: storedMessages } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("chat_id", documentId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(MAX_HISTORY);

  const history: ChatMessage[] = (storedMessages ?? []).map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.created_at,
  }));

  // ---- Adaptive tutor: blend stored history with the fresh client turn ----
  const freshTurn = clientMessages.filter((m) => m.role === "user");
  const lastUser = freshTurn[freshTurn.length - 1]?.content ?? "";
  const lastAssistant =
    clientMessages[clientMessages.length - 1]?.role === "assistant"
      ? clientMessages[clientMessages.length - 1].content
      : null;

  const profile = await getProfile(supabase, user.id);
  const persona = buildStudyContext(profile);

  // Log a study activity when a brand-new conversation starts so dashboards
  // can count AI chat sessions.
  if (history.length === 0) {
    await logActivity(supabase, {
      userId: user.id,
      documentId,
      type: "chat",
      title: doc.title,
    });
  }

  // Persist the user's message immediately so the conversation survives reloads.
  const { data: savedUserMsg } = await supabase
    .from("chat_messages")
    .insert({
      id: crypto.randomUUID(),
      chat_id: documentId,
      user_id: user.id,
      role: "user",
      content: lastUser,
    })
    .select("id, role, content, created_at")
    .single();

  const system = [
    `You are a warm, patient college professor and personal AI tutor.`,
    `You are teaching a student "${doc.title}".`,
    persona,
    `Teach like an excellent teacher: break ideas into steps, use analogies and examples, check understanding, and adapt your pace to the student.`,
    `Answer questions using ONLY the provided study notes.`,
    `If the student asks to be taught "like a professor", use formal academic language and depth.`,
    `If the student asks to explain "to a 10-year-old", use simple words, fun analogies, and short sentences.`,
    `If the student asks you to "keep teaching until I understand", ask short questions to check understanding and re-explain anything they miss.`,
    `If the answer is not in the notes, say so clearly, then give brief general guidance.`,
    `Be concise, clear, and use Markdown formatting (headings, bullets, bold) when it improves readability.`,
    `The student may ask follow-up questions — remember the conversation you have shared with them.`,
    ``,
    `STUDY NOTES:`,
    doc.content,
  ].join("\n");

  const messages: NvidiaMessage[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  if (
    history[history.length - 1]?.role !== "user" ||
    history[history.length - 1]?.content !== lastUser
  ) {
    messages.push({ role: "user", content: lastUser });
  }

  if (lastAssistant) {
    messages.push({ role: "assistant", content: lastAssistant });
  }

  // NVIDIA streams OpenAI-style SSE frames (`data: {"choices":[...]}`) that the
  // chat UI already parses, so the upstream response can be passed through
  // byte-for-byte. We still read it so the assistant reply can be persisted.
  const upstream = await nvidiaStream({
    system,
    messages: messages.slice(-20),
    temperature: 0.7,
    maxTokens: 2048,
  });

  const upstreamBody = upstream.body;
  if (!upstreamBody) {
    return NextResponse.json(
      { error: "NVIDIA returned an empty response." },
      { status: 502 },
    );
  }

  const decoder = new TextDecoder();
  let full = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const reader = upstreamBody.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          controller.enqueue(value);
        }
      } finally {
        controller.close();
        // Persist the assistant reply.
        const assistantText = extractSseContent(full);
        if (assistantText.trim()) {
          await supabase.from("chat_messages").insert({
            id: crypto.randomUUID(),
            chat_id: documentId,
            user_id: user.id,
            role: "assistant",
            content: assistantText,
          });
        }
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

/**
 * Extracts the assistant's full text from the accumulated OpenAI-style SSE
 * payload (multiple `data: {...}` frames ending in `data: [DONE]`).
 */
function extractSseContent(acc: string): string {
  let out = "";
  for (const line of acc.split(/\r?\n/)) {
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const parsed = JSON.parse(payload) as {
        choices?: { delta?: { content?: string } }[];
      };
      const piece = parsed.choices?.[0]?.delta?.content;
      if (typeof piece === "string") out += piece;
    } catch {
      // ignore malformed frames
    }
  }
  return out;
}
