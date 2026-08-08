"use client";

import { useEffect, useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_CARDS = [
  {
    front: "What does mitochondria produce?",
    back: "ATP — the energy currency of the cell.",
  },
  {
    front: "Define osmosis.",
    back: "Movement of water across a semi-permeable membrane.",
  },
  {
    front: "Newton's second law?",
    back: "F = ma — force equals mass times acceleration.",
  },
];

/**
 * Animated flashcard mockup for the hero. Auto-flips between the front and
 * back of a small set of demo cards using the existing 3D utilities from
 * globals.css, then advances to the next card. Pure decoration — never a
 * real upload or API call.
 */
export function AnimatedFlashcard({
  className,
}: {
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFlipped((f) => {
        if (!f) return true;
        // advance to next card on the un-flip
        setIndex((i) => (i + 1) % DEMO_CARDS.length);
        return false;
      });
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  const card = DEMO_CARDS[index];

  return (
    <div className={cn("perspective-1200", className)}>
      <div className="preserve-3d relative h-72 w-full max-w-sm sm:h-80">
        <div
          className={cn(
            "preserve-3d absolute inset-0 transition-transform duration-700",
            flipped && "rotate-y-180",
          )}
        >
          {/* Front */}
          <div className="backface-hidden absolute inset-0 flex flex-col justify-between rounded-3xl border border-cream-200 bg-white p-6 shadow-xl shadow-ink-900/5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <Wand2 className="h-3.5 w-3.5" />
                Flashcard
              </span>
              <span className="text-xs text-ink-400">
                {index + 1} / {DEMO_CARDS.length}
              </span>
            </div>
            <p className="font-display text-2xl font-semibold leading-tight text-ink-900">
              {card.front}
            </p>
            <p className="text-xs text-ink-400">Click to flip · auto-playing demo</p>
          </div>
          {/* Back */}
          <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-xl shadow-ink-900/5">
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              <Sparkles className="h-3.5 w-3.5" />
              Answer
            </div>
            <p className="font-display text-2xl font-semibold leading-tight text-ink-900">
              {card.back}
            </p>
            <p className="text-xs text-ink-400">StudyAI generated · sample only</p>
          </div>
        </div>
      </div>
    </div>
  );
}