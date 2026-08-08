"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  KeyboardIcon,
  Loader2,
  RotateCcw,
  Shuffle,
} from "lucide-react";
import type { Flashcard } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function FlashcardDeck({ documentId }: { documentId: string }) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<number[]>([]);
  const [review, setReview] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = cards.length;

  const stats = useMemo(() => {
    return {
      known: known.length,
      review: review.length,
      remaining: total - known.length,
    };
  }, [known, review, total]);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, count: 10 }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Failed to generate flashcards.");
      setCards(body.cards ?? []);
      setIndex(0);
      setFlipped(false);
      setKnown([]);
      setReview([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const resetReview = () => {
    setKnown([]);
    setReview([]);
    setIndex(0);
    setFlipped(false);
  };

  const goNext = useCallback(() => {
    setFlipped(false);
    setIndex((i) => (i + 1) % Math.max(total, 1));
  }, [total]);

  const goPrev = useCallback(() => {
    setFlipped(false);
    setIndex((i) => (i - 1 + Math.max(total, 1)) % Math.max(total, 1));
  }, [total]);

  // Keyboard shortcuts: ←/→ to navigate, Space/Enter to flip.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  function toggleKnown() {
    setKnown((prev) => {
      const next = prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index];
      if (next.includes(index)) {
        setReview((r) => r.filter((i) => i !== index));
      }
      return next;
    });
  }

  function toggleReview() {
    setReview((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  }

  if (total === 0) {
    if (loading) {
      return (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-card text-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Generating 10 flashcards from your document…
          </p>
        </div>
      );
    }
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-5 rounded-3xl border border-border bg-card p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-400 text-white shadow-sm">
          <Brain className="h-7 w-7" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-ink-900">
            Ready to drill this document?
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Generate a deck of 10 flashcards covering the key definitions and
            concepts from your notes. Flip each card to test yourself.
          </p>
        </div>
        {error && (
          <p className="max-w-md rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button onClick={generate} loading={loading}>
          {loading ? "Generating…" : "Generate flashcards"}
        </Button>
      </div>
    );
  }

  const card = cards[index];
  const isKnown = known.includes(index);
  const isReview = review.includes(index);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6">
      {/* Study stats */}
      <div className="flex w-full items-center justify-between gap-3">
        <div className="grid flex-1 grid-cols-3 gap-2">
          <StatChip label="Known" value={stats.known} tone="emerald" />
          <StatChip label="Review" value={stats.review} tone="amber" />
          <StatChip label="Remaining" value={stats.remaining} tone="neutral" />
        </div>
        <Button variant="ghost" size="sm" onClick={resetReview} className="shrink-0" aria-label="Reset progress">
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
      </div>

      {/* Progress bar */}
      <div className="flex w-full items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
            style={{ width: `${(stats.known / total) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {stats.known}/{total} known
        </span>
      </div>

      {/* Flashcard */}
      <div className="perspective-1200 w-full">
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-label="Flip card"
          aria-pressed={flipped}
          className={cn(
            "preserve-3d relative block h-80 w-full cursor-pointer appearance-none rounded-3xl outline-none sm:h-96",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
            "transition-transform duration-500 ease-in-out",
            flipped && "rotate-y-180",
          )}
        >
          <div className="backface-hidden absolute inset-0 flex flex-col justify-between rounded-3xl border border-border bg-card p-7 shadow-[0_16px_40px_-20px_rgba(30,25,18,0.18)] sm:p-9">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Question
              </span>
              <span className="text-xs font-medium tabular-nums text-muted-foreground">
                {index + 1} / {total}
              </span>
            </div>
            <p className="font-display text-xl font-semibold leading-snug text-foreground sm:text-2xl">
              {card.front}
            </p>
            <p className="text-xs text-muted-foreground">Click to reveal answer</p>
          </div>

          <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between rounded-3xl border border-emerald-300/60 bg-emerald-50 p-7 shadow-[0_16px_40px_-20px_rgba(30,25,18,0.18)] dark:border-emerald-500/30 dark:bg-emerald-500/10 sm:p-9">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Answer
              </span>
              {isKnown && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-600/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  <Check className="h-3 w-3" />
                  Known
                </span>
              )}
            </div>
            <p className="font-display text-lg font-medium leading-relaxed text-foreground sm:text-xl">
              {card.back}
            </p>
            <p className="text-xs text-muted-foreground">Click to flip back</p>
          </div>
        </button>
      </div>

      {/* Mark as known / review */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant={isKnown ? "secondary" : "outline"}
          size="sm"
          onClick={toggleKnown}
          aria-pressed={isKnown}
        >
          <Check className="h-4 w-4" />
          {isKnown ? "Known" : "Mark as known"}
        </Button>
        <Button
          variant={isReview ? "secondary" : "outline"}
          size="sm"
          onClick={toggleReview}
          aria-pressed={isReview}
        >
          <RotateCcw className="h-4 w-4" />
          {isReview ? "In review" : "Review again"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCards(shuffle(cards));
            setIndex(0);
            setFlipped(false);
          }}
          aria-label="Shuffle deck"
        >
          <Shuffle className="h-4 w-4" />
          <span className="hidden sm:inline">Shuffle</span>
        </Button>
        <Button variant="outline" size="sm" onClick={generate} loading={loading} aria-label="Regenerate deck">
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">Regenerate</span>
        </Button>
      </div>

      {/* Navigation */}
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={goPrev} disabled={total === 1} aria-label="Previous card">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </Button>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          Card {index + 1} of {total}
        </span>
        <Button onClick={goNext} size="sm" disabled={total === 1} aria-label="Next card">
          <span className="hidden sm:inline">{index === total - 1 ? "Start over" : "Next"}</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <KeyboardIcon className="h-3.5 w-3.5" />
        Shortcuts: Space to flip · ← → to navigate
      </p>
    </div>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "neutral";
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl border border-border bg-card px-2 py-2 text-center shadow-sm">
      <span
        className={cn(
          "font-display text-lg font-bold tabular-nums",
          tone === "emerald" && "text-emerald-600 dark:text-emerald-400",
          tone === "amber" && "text-amber-600 dark:text-amber-400",
          tone === "neutral" && "text-foreground",
        )}
      >
        {value}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}