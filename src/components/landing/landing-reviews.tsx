import { Star } from "lucide-react";
import { LandingReveal } from "@/components/landing/landing-reveal";

/**
 * Reviews section.
 *
 * StudyAI does not yet publish verified student testimonials, so this section
 * shows clearly labelled *sample quotes for design purposes* — not real
 * student reviews. Swap these out for genuine, verified testimonials before
 * claiming real-world results.
 */
const SAMPLE_REVIEWS = [
  {
    quote:
      "I photographed my whole organic chemistry notebook and StudyAI turned it into notes and flashcards in minutes.",
    name: "Sample quote",
    role: "Illustrative example 1",
    initials: "S1",
  },
  {
    quote:
      "The AI tutor explains things like I'm ten, then quizzes me until I actually understand. Great for exam prep.",
    name: "Sample quote",
    role: "Illustrative example 2",
  },
  {
    quote:
      "Upload my PDF and I have summaries, a quiz and a mind map ready before my coffee gets cold.",
    name: "Sample quote",
    role: "Illustrative example 3",
  },
];

export function LandingReviews() {
  return (
    <section id="reviews" className="scroll-mt-16 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-cream-200 bg-card/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink-500">
            Reviews
          </span>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            What students say
          </h2>
          <p className="mt-4 text-lg text-ink-600">
            Sample quotes shown for illustration only — StudyAI has not yet
            published verified student reviews.
          </p>
        </LandingReveal>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {SAMPLE_REVIEWS.map((review, i) => (
            <LandingReveal key={i} delay={i * 0.1}>
              <figure className="flex h-full flex-col justify-between rounded-3xl border border-cream-200 bg-card/80 p-7 shadow-sm">
                <div>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, star) => (
                      <Star
                        key={star}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-sm leading-relaxed text-ink-700">
                    “{review.quote}”
                  </blockquote>
                </div>
                <figcaption className="mt-6 border-t border-cream-200 pt-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-cream-200/60 px-3 py-1 text-xs font-medium text-ink-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Sample content — not a real review
                  </span>
                </figcaption>
              </figure>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
}