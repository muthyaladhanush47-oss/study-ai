import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingReveal } from "@/components/landing/landing-reveal";

/**
 * Final call-to-action. Leads to the real signup/auth flow — StudyAI has no
 * anonymous workspace, so new users start at the existing signup route.
 */
export function LandingCta() {
  return (
    <section id="cta" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-ink-900 px-6 py-16 text-center sm:px-16">
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
            <div className="relative">
              <h2 className="font-display text-4xl font-semibold tracking-tight text-cream-50 sm:text-5xl">
                Your next exam, handled.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-cream-200">
                Create your free account and turn your notes — typed or
                handwritten — into a personal AI study system in under a minute.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 sm:w-auto"
                >
                  Create free account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-full border border-cream-300/30 px-7 py-3.5 text-base font-semibold text-cream-100 transition hover:bg-cream-50/10 sm:w-auto"
                >
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </LandingReveal>
      </div>
    </section>
  );
}