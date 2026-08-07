"use client";

import { useCallback, useState } from "react";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
} from "lucide-react";
import type { Flashcard } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const goNext = useCallback(() => {
    setFlipped(false);
    setIndex((i) => (i + 1) % Math.max(cards.length, 1));
  }, [cards.length]);

  const goPrev = useCallback(() => {
    setFlipped(false);
    setIndex((i) => (i - 1 + cards.length) % Math.max(cards.length, 1));
  }, [cards.length]);

  if (cards.length > 0) {
    const card = cards[index];
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Card {index + 1} of {cards.length}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCards(shuffle(cards));
                setIndex(0);
                setFlipped(false);
              }}
            >
              <Shuffle className="h-4 w-4" />
              Shuffle
            </Button>
            <Button variant="outline" size="sm" onClick={generate} loading={loading}>
              <RotateCcw className="h-4 w-4" />
              Regenerate
            </Button>
          </div>
        </div>

        <div className="perspective-1200 mx-auto max-w-2xl">
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            aria-label="Flip card"
            className="preserve-3d relative block h-72 w-full cursor-pointer"
          >
            <div
              className={cn(
                "preserve-3d absolute inset-0 transition-transform duration-500",
                flipped && "rotate-y-180",
              )}
            >
              <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-fuchsia-500/10 p-8 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Question
                </p>
                <p className="mt-3 text-lg font-medium leading-relaxed">
                  {card.front}
                </p>
                <p className="mt-6 text-xs text-muted-foreground">
                  Click to flip
                </p>
              </div>
              <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-8 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Answer
                </p>
                <p className="mt-3 text-lg font-medium leading-relaxed">
                  {card.back}
                </p>
                <p className="mt-6 text-xs text-muted-foreground">
                  Click to flip back
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="mx-auto flex max-w-2xl items-center justify-center gap-4">
          <Button variant="outline" onClick={goPrev} disabled={cards.length === 1}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button onClick={goNext} disabled={cards.length === 1} className="min-w-28">
            {index === cards.length - 1 ? "Start over" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="flex flex-col items-center justify-center gap-4 p-10 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-fuchsia-600 text-white shadow-lg">
        <Brain className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Generate flashcards</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Get 10 ready-to-review cards covering the key definitions and concepts
          from your notes. Flip each card to test yourself.
        </p>
      </div>
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button onClick={generate} loading={loading}>
        {loading ? "Generating…" : "Generate flashcards"}
      </Button>
    </Card>
  );
}
