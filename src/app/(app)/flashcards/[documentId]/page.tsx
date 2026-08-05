import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient, getUser } from "@/lib/supabase/server";
import { FlashcardDeck } from "@/components/flashcard-deck";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Flashcards",
};

export const dynamic = "force-dynamic";

export default async function FlashcardsPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const user = await getUser();

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("id, title")
    .eq("id", documentId)
    .eq("user_id", user?.id)
    .single();

  if (!doc) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" aria-label="Back to dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Flashcards
          </h1>
          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
            {doc.title}
          </p>
        </div>
      </div>
      <FlashcardDeck documentId={documentId} />
    </div>
  );
}
