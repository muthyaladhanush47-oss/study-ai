import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUser, createClient } from "@/lib/supabase/server";
import { ChatView } from "@/components/chat";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/types";

export const metadata: Metadata = {
  title: "Chat with notes",
};

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const user = await getUser();
  if (!user) notFound();

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("id, title, text_source, is_ocr_ready")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();

  if (!doc) notFound();

  const { data: stored } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("chat_id", documentId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(50);

  const initialMessages: ChatMessage[] = (stored ?? []).map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.created_at,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" aria-label="Back to dashboard">
            <ArrowLeft />
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
            AI Study Tutor
          </h1>
          <p className="truncate text-sm text-muted-foreground">{doc.title}</p>
        </div>
      </div>
      <ChatView
        documentId={documentId}
        initialMessages={initialMessages}
        needsOcr={doc.text_source === "scanned" && !doc.is_ocr_ready}
      />
    </div>
  );
}
