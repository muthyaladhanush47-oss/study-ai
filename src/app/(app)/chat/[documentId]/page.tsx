import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getUser, createClient } from "@/lib/supabase/server";
import { ChatView } from "@/components/chat";
import { Button } from "@/components/ui/button";
import { GoogleAd } from "@/components/ads/google-ad";
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/documents">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Back to documents"
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
            AI Study Tutor
          </h1>
          <p className="truncate text-sm text-muted-foreground">{doc.title}</p>
        </div>
        <span className="ml-auto hidden items-center gap-1.5 rounded-full bg-emerald-600/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 sm:inline-flex dark:text-emerald-300">
          <Sparkles className="h-3 w-3" />
          AI powered
        </span>
      </div>

      <ChatView
        documentId={documentId}
        initialMessages={initialMessages}
        needsOcr={doc.text_source === "scanned" && !doc.is_ocr_ready}
      />

      <GoogleAd slot="studyai-chat" format="auto" className="min-h-20" />
    </div>
  );
}
