import { LandingReveal } from "@/components/landing/landing-reveal";

/**
 * FAQ. Every claim here is backed by the actual application:
 * - 100 MB upload limit (src/app/api/upload/route.ts, upload-dialog.tsx)
 * - supported types: PDF/JPG/PNG/WebP
 * - OCR via a vision model, text AI via NVIDIA DeepSeek V4 Flash
 * - free + ad-supported, private via Supabase RLS
 * - per-page OCR with resume
 */
const FAQS = [
  {
    q: "Can StudyAI really read my handwritten notes?",
    a: "Yes. When you upload a PDF that has no text layer — like a scan of your handwriting — StudyAI runs OCR with a vision AI model, transcribes every page, and stores the text so summaries, flashcards and chat all work as usual.",
  },
  {
    q: "What AI models does StudyAI use?",
    a: "Text AI — summaries, flashcards, quizzes, mind maps and the tutor — runs on NVIDIA's DeepSeek V4 Flash. Handwriting OCR runs on a separate Gemini vision model.",
  },
  {
    q: "Is StudyAI really free?",
    a: "Yes. StudyAI is free to use with no subscription. We keep the lights on with unobtrusive ads.",
  },
  {
    q: "How large can my uploads be?",
    a: "PDFs, JPGs, PNGs and WebP images up to 100 MB are supported. Typed PDFs are indexed instantly; scanned or handwritten files are transcribed with OCR automatically.",
  },
  {
    q: "Are my documents private?",
    a: "Your files are stored in your own Supabase bucket with row-level security, and every AI request is authenticated to your account. We never sell or share your notes.",
  },
  {
    q: "What if a long PDF doesn't finish in one run?",
    a: "Pages are processed one at a time and each finished page is saved immediately. If a run times out or fails, your completed pages are kept and re-running OCR resumes from the first unfinished page.",
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="scroll-mt-16 bg-cream-100/70 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <LandingReveal className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            FAQ
          </span>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Frequently asked questions
          </h2>
        </LandingReveal>

        <div className="mt-12 space-y-3">
          {FAQS.map((faq, i) => (
            <LandingReveal key={faq.q} delay={i * 0.05}>
              <details className="group rounded-2xl border border-cream-200 bg-white/80 p-5 shadow-sm open:shadow-md">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-semibold text-ink-900 sm:text-lg">
                  {faq.q}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cream-300 text-ink-500 transition group-open:rotate-45 group-open:text-emerald-600">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">
                  {faq.a}
                </p>
              </details>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
}