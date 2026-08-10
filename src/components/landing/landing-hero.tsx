import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { AnimatedFlashcard } from "@/components/landing/animated-flashcard";
import { LandingReveal } from "@/components/landing/landing-reveal";

const STATS = [
  ["Up to 100 MB", "per upload"],
  ["6", "study tools"],
  ["Private", "by default"],
];

/**
 * Hero. The primary CTA leads to the real app — StudyAI requires an account,
 * so it lands on the existing signup route (which redirects to /dashboard for
 * signed-in users). No fake upload UI here.
 */
export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:pb-28 lg:pt-24">
        <LandingReveal>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            Reads handwriting · Free · No subscription
          </span>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink-900 sm:text-6xl lg:text-7xl">
            Turn your notes into{" "}
            <span className="text-emerald-600">study superpowers</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600">
            Upload a PDF — even a photo of your handwritten notes — and get
            summaries, flashcards, quizzes, mind maps, and an AI tutor that
            answers from your own material.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500"
            >
              Start studying free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-cream-300 bg-card/70 px-7 py-3.5 text-base font-semibold text-ink-800 transition hover:border-emerald-300 hover:text-emerald-700"
            >
              See how it works
            </a>
          </div>
          <div className="mt-12 grid max-w-md grid-cols-3 gap-4">
            {STATS.map(([value, label]) => (
              <div key={label}>
                <div className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
                  {value}
                </div>
                <div className="mt-1 text-xs text-ink-500 sm:text-sm">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </LandingReveal>

        <LandingReveal
          delay={0.15}
          className="flex justify-center px-4 pt-14 sm:px-6 lg:justify-end lg:px-2 lg:pt-0"
        >
          <AnimatedFlashcard className="w-full max-w-[360px] sm:max-w-[380px]" />
        </LandingReveal>
      </div>
    </section>
  );
}