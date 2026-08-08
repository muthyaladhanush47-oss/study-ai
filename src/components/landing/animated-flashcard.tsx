"use client";

import { useState } from "react";
import { CheckCheck, RotateCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const QUESTION = "What does Newton's second law describe?";
const ANSWER =
  "The net force acting on an object equals its mass multiplied by its acceleration. (F = ma)";
const CURRENT = 3;
const TOTAL = 12;

/**
 * Realistic StudyAI flashcard preview for the hero. A clean rectangular card
 * with a subtle shadow and a smooth 3D flip on click — no floating or looping
 * animation, so it reads as a real product preview, not a decoration. Respects
 * prefers-reduced-motion. Pure decoration — never a real upload or API call.
 */
export function AnimatedFlashcard({
  className,
}: {
  className?: string;
}) {
  const [flipped, setFlipped] = useState(false);
  const progress = Math.round((CURRENT / TOTAL) * 100);

  return (
    <div className={cn("w-full max-w-[380px] select-none", className)}>
      <div className="perspective-1200">
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-pressed={flipped}
          aria-label={flipped ? "Show question" : "Show answer"}
          className={cn(
            "preserve-3d relative block min-h-[420px] w-full cursor-pointer appearance-none rounded-[26px] text-left outline-none",
            "focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "transition-transform duration-700 ease-in-out",
            flipped && "rotate-y-180",
          )}
        >
          {/* Front — question */}
          <div className="backface-hidden absolute inset-0 flex flex-col justify-between rounded-[26px] border border-cream-200 bg-card p-7 shadow-[0_24px_48px_-24px_rgba(30,25,18,0.24)] sm:p-8">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <Sparkles className="h-3 w-3" />
                Flashcard
              </span>
              <span className="rounded-full border border-cream-200 bg-card px-2.5 py-1 text-[11px] font-semibold text-ink-500 dark:border-ink-700 dark:text-ink-400">
                {CURRENT} / {TOTAL}
              </span>
            </div>

            <p className="mt-8 font-display text-2xl font-semibold leading-snug text-ink-900 sm:text-[26px]">
              {QUESTION}
            </p>

            <div>
              <div className="flex items-center justify-between gap-3 text-xs text-ink-400">
                <span>Question</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <RotateCw className="h-3.5 w-3.5" />
                  Click to reveal
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-cream-100 dark:bg-ink-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Back — answer */}
          <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between rounded-[26px] border border-emerald-200 bg-emerald-50 p-7 shadow-[0_24px_48px_-24px_rgba(30,25,18,0.24)] dark:border-emerald-500/30 dark:bg-emerald-500/10 sm:p-8">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <Sparkles className="h-3 w-3" />
                Answer
              </span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                <CheckCheck className="h-3 w-3" />
                Known
              </span>
            </div>

            <p className="mt-8 font-display text-xl font-semibold leading-snug text-ink-900 sm:text-[22px]">
              {ANSWER}
            </p>

            <div>
              <div className="flex items-center justify-between gap-3 text-xs text-emerald-800/70 dark:text-emerald-200/70">
                <span>F = ma — you&apos;ve got this</span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <RotateCw className="h-3.5 w-3.5" />
                  Tap to flip
                </span>
              </div>
              <div className="mt-3 rounded-xl border border-emerald-200/70 bg-card/60 px-3 py-2 text-center text-[11px] font-medium text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300">
                ✓ Marked known · 8 of 10 in this round
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}