import {
  Brain,
  FileUp,
  Layers,
  ListChecks,
  MessageSquareText,
  ScanText,
  Workflow,
} from "lucide-react";
import { LandingReveal } from "@/components/landing/landing-reveal";

const FEATURES = [
  {
    icon: FileUp,
    title: "Upload PDFs and photos",
    description:
      "Drag in typed PDFs, scanned documents, or photos of handwritten notes — up to 100 MB. Files upload directly to your private storage.",
  },
  {
    icon: ScanText,
    title: "Handwriting OCR",
    description:
      "Scanned and handwritten pages are transcribed page by page with a vision AI model, preserving headings, lists and formulas.",
  },
  {
    icon: Layers,
    title: "AI notes & summaries",
    description:
      "Turn hundreds of pages into concise chapter-by-chapter overviews with the key points that matter for your exam.",
  },
  {
    icon: Brain,
    title: "Flashcards",
    description:
      "Generate ready-to-review flashcards from any document and drill them with a flip-card deck.",
  },
  {
    icon: ListChecks,
    title: "Quizzes",
    description:
      "Create multiple-choice quizzes with instant feedback and explanations to test yourself before the real thing.",
  },
  {
    icon: Workflow,
    title: "Mind maps",
    description:
      "See the whole topic at a glance with interactive mind maps that help you connect ideas and memorize faster.",
  },
];

/**
 * Grid of the features StudyAI actually ships. Claims are limited to what the
 * application really does — no invented capabilities.
 */
export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-16 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Features
          </span>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Everything you need to study smarter
          </h2>
          <p className="mt-4 text-lg text-ink-600">
            One upload. Six study tools. Built for students, not giant platforms.
          </p>
        </LandingReveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <LandingReveal key={feature.title} delay={(i % 3) * 0.1}>
              <div className="group h-full rounded-3xl border border-cream-200 bg-card/80 p-7 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm transition group-hover:scale-105">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-ink-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  {feature.description}
                </p>
              </div>
            </LandingReveal>
          ))}

          {/* AI tutor — spans the full row */}
          <LandingReveal className="sm:col-span-2 lg:col-span-3" delay={0.2}>
            <div className="flex flex-col items-start gap-5 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-cream-100 p-7 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink-900 text-cream-50">
                <MessageSquareText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-ink-900">
                  AI tutor with memory
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  Ask questions in plain English. Your tutor reads the whole
                  document, remembers the conversation and adapts to your
                  learning level — so it answers from your own notes, not
                  generic knowledge.
                </p>
              </div>
            </div>
          </LandingReveal>
        </div>
      </div>
    </section>
  );
}