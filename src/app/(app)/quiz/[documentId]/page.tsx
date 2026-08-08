import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { createClient, getUser } from "@/lib/supabase/server";
import { QuizView } from "@/components/quiz-view";
import { Button } from "@/components/ui/button";
import { GoogleAd } from "@/components/ads/google-ad";

export const metadata: Metadata = {
  title: "Quiz",
};

export const dynamic = "force-dynamic";

export default async function QuizPage({
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
            Practice quiz
          </h1>
          <p className="truncate text-sm text-muted-foreground">{doc.title}</p>
        </div>
        <span className="ml-auto hidden items-center gap-1.5 rounded-full bg-emerald-600/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 sm:inline-flex dark:text-emerald-300">
          <Sparkles className="h-3 w-3" />
          AI generated
        </span>
      </div>

      <QuizView documentId={documentId} />

      <GoogleAd slot="studyai-quiz" format="auto" className="min-h-20" />
    </div>
  );
}