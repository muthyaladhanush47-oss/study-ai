"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, FileText, Loader2, Sparkles } from "lucide-react";
import type { ChapterSummary, SummaryResult } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SummaryView({ documentId }: { documentId: string }) {
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Failed to generate summary.");
      setSummary(body as SummaryResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (summary) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            {summary.chapters.length}{" "}
            {summary.chapters.length === 1 ? "section" : "sections"} summarized
          </h2>
          <Button variant="outline" size="sm" onClick={generate} disabled={loading}>
            Regenerate
          </Button>
        </div>

        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Overview
          </p>
          <p className="mt-2 leading-relaxed text-zinc-700 dark:text-zinc-300">
            {summary.overview}
          </p>
        </Card>

        <div className="space-y-4">
          {summary.chapters.map((chapter, i) => (
            <Card key={i} className="overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [i]: !prev[i] }))
                }
                className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold">{chapter.chapter}</h3>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-zinc-400 transition",
                    expanded[i] && "rotate-180",
                  )}
                />
              </button>
              {expanded[i] && (
                <div className="border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
                  <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {chapter.summary}
                  </p>
                  {chapter.keyPoints.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {chapter.keyPoints.map((point, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                        >
                          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500 dark:text-brand-400" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="flex flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 text-white shadow-lg">
        <FileText className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Generate chapter summaries</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          StudyAI will read your notes and produce an overview plus a breakdown
          of each chapter or section with key points.
        </p>
      </div>
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </p>
      )}
      <Button onClick={generate} loading={loading}>
        {loading ? "Summarizing…" : "Generate summary"}
      </Button>
    </Card>
  );
}
