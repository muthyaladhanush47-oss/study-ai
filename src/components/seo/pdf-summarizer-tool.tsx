"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { NotesView } from "@/components/summary-view";

export function PdfSummarizerTool() {
  return (
    <Suspense fallback={null}>
      <Summarizer />
    </Suspense>
  );
}

function Summarizer() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) return null;

  return (
    <section className="border-t border-border py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Your AI summary
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Turn this document into chapter-by-chapter notes with key points —
            including handwritten scans.
          </p>
        </div>
        <div className="mt-10">
          <NotesView documentId={id} />
        </div>
      </div>
    </section>
  );
}
