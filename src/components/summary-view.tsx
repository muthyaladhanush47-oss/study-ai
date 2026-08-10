"use client";

import { useState } from "react";
import {
  Flame,
  GraduationCap,
  Lightbulb,
  Loader2,
  NotepadText,
  Pin,
  Star,
  Pencil,
  Sigma,
  ListChecks,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import type { NoteSection, NotesResult } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics-events";

const sectionMeta: Record<
  NoteSection["kind"],
  { label: string; emoji: string; icon: typeof Pencil; accent: string }
> = {
  definition: { label: "Definition", emoji: "✍", icon: Pencil, accent: "text-sky-600 dark:text-sky-400" },
  remember: { label: "Important Points", emoji: "⭐", icon: Star, accent: "text-amber-600 dark:text-amber-400" },
  trick: { label: "Trick", emoji: "💡", icon: Lightbulb, accent: "text-emerald-600 dark:text-emerald-400" },
  equation: { label: "Equation", emoji: "🌳", icon: Sigma, accent: "text-emerald-600 dark:text-emerald-400" },
  examQuestions: { label: "Exam questions", emoji: "📝", icon: ListChecks, accent: "text-rose-600 dark:text-rose-400" },
  fiveMarkAnswer: { label: "5 mark answer", emoji: "🔥", icon: Flame, accent: "text-orange-600 dark:text-orange-400" },
  oneLineRevision: { label: "One line revision", emoji: "📌", icon: Pin, accent: "text-indigo-600 dark:text-indigo-400" },
};

function SectionBlock({ section }: { section: NoteSection }) {
  const meta = sectionMeta[section.kind];
  const Icon = meta.icon;
  return (
    <div className="notebook-page mb-4 p-4 sm:p-5">
      <h4 className={cn("mb-2 flex items-center gap-2 font-hand text-xl font-bold sm:text-2xl", meta.accent)}>
        <span className="text-2xl sm:text-3xl">{meta.emoji}</span>
        <Icon className="h-5 w-5" />
        {meta.label}
      </h4>
      {section.kind === "examQuestions" ? (
        <ol className="ml-6 list-decimal space-y-1.5 font-kalam text-lg leading-relaxed text-foreground/90">
          {section.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      ) : section.kind === "equation" ? (
        <div className="mt-1 overflow-x-auto rounded-xl border border-emerald-500/30 bg-background/60 px-4 py-3">
          <pre className="font-kalam text-lg font-bold leading-loose whitespace-pre-wrap text-emerald-700 dark:text-emerald-300">
            {section.text}
          </pre>
        </div>
      ) : (
        <p className="font-kalam text-lg leading-relaxed text-foreground/90 sm:text-xl">
          {section.text}
        </p>
      )}
    </div>
  );
}

type SseEvent = { event: string; data: Record<string, unknown> };

function parseSseStream(raw: string): SseEvent[] {
  const events: SseEvent[] = [];
  for (const block of raw.split("\n\n")) {
    let event = "message";
    const dataLines: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trim());
      }
    }
    if (dataLines.length === 0) continue;
    try {
      events.push({ event, data: JSON.parse(dataLines.join("\n")) });
    } catch {
      // ignore malformed frames
    }
  }
  return events;
}

export function NotesView({ documentId }: { documentId: string }) {
  const [notes, setNotes] = useState<NotesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setProgress(null);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error ?? `Failed to generate notes (${res.status}).`,
        );
      }

      if (!res.body) throw new Error("Failed to generate notes.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        for (const ev of parseSseStream(buffer)) {
          if (ev.event === "status") {
            setProgress(String(ev.data.message ?? ""));
          } else if (ev.event === "error") {
            throw new Error(
              String(ev.data.message ?? "Failed to generate notes."),
            );
          } else if (ev.event === "result") {
            setNotes(ev.data as unknown as NotesResult);
            trackEvent("summary_created", {
              chapters: (ev.data as unknown as NotesResult).notes.length,
            });
            finished = true;
            break;
          }
        }
        if (finished) break;
        const lastBreak = buffer.lastIndexOf("\n\n");
        if (lastBreak >= 0) buffer = buffer.slice(lastBreak + 2);
      }

      if (!finished) {
        throw new Error(
          "Notes generation timed out. Please try again — partial work is saved.",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  if (notes) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <NotepadText className="h-5 w-5 text-primary" />
            {notes.notes.length}{" "}
            {notes.notes.length === 1 ? "chapter" : "chapters"} of handwritten notes
          </h2>
          <Button variant="outline" size="sm" onClick={generate} loading={loading}>
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate
          </Button>
        </div>

        {/* Overview card — handwritten summary of everything */}
        <Card className="notebook-page shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <p className="mb-2 flex items-center gap-2 font-hand text-2xl font-bold text-primary">
              <GraduationCap className="h-6 w-6" />
              The whole picture
            </p>
            <p className="font-kalam text-xl leading-relaxed text-foreground/90">
              {notes.overview}
            </p>
          </CardContent>
        </Card>

        {notes.notes.map((note, i) => (
          <section key={i} aria-label={note.chapter}>
            {/* Chapter header */}
            <div className="mb-4 mt-8 flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-400 text-lg font-bold text-white shadow-md">
                {i + 1}
              </span>
              <h3 className="font-hand text-2xl font-bold tracking-tight sm:text-3xl">
                📒 {note.chapter}
              </h3>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-primary/40 via-border to-transparent" />
            <div className="mt-4">
              {note.sections.map((section, j) => (
                <SectionBlock key={j} section={section} />
              ))}
            </div>
          </section>
        ))}

        <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          <Sparkles className="mx-auto mb-1 h-4 w-4 text-primary" />
          Rewrite these notes in your own words, then test yourself with the
          flashcard and quiz tools.
        </div>
      </div>
    );
  }

  return (
    <Card className="flex flex-col items-center justify-center gap-4 p-10 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-400 text-white shadow-lg">
        <NotepadText className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Generate handwritten-style notes</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          StudyAI turns your PDF into clean, notebook-style notes with
          definitions, memory tricks, equations, exam questions and a 5-mark
          answer — like a friend who took thorough notes for you.
        </p>
      </div>
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {loading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          {progress ?? "Preparing document…"}
        </p>
      )}
      <Button onClick={generate} loading={loading}>
        {loading ? "Writing notes…" : "Generate AI notes"}
      </Button>
    </Card>
  );
}
