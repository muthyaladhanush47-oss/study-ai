const ITEMS = [
  "PDF upload up to 100 MB",
  "Handwriting OCR",
  "AI chapter summaries",
  "Flashcards",
  "Quizzes with explanations",
  "Interactive mind maps",
  "AI tutor with memory",
  "Photo uploads",
  "Typed & scanned PDFs",
  "Private by default",
];

/**
 * Infinite scrolling feature strip (pure CSS marquee, respects the design's
 * "marquee / features strip" section). Content is duplicated so the translateX
 * loop is seamless.
 */
export function LandingMarquee() {
  const row = ITEMS.map((item) => (
    <span
      key={item}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-cream-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-ink-700 shadow-sm"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      {item}
    </span>
  ));

  return (
    <section
      aria-label="Features at a glance"
      className="overflow-hidden border-y border-cream-200 bg-cream-100/70 py-4"
    >
      <div className="flex w-max animate-marquee gap-3">
        <div className="flex gap-3">{row}</div>
        <div className="flex gap-3" aria-hidden>
          {row}
        </div>
      </div>
    </section>
  );
}