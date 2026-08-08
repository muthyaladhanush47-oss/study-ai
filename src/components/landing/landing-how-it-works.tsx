import {
  FileUp,
  MessageSquareText,
  ScanText,
  Sparkles,
} from "lucide-react";
import { LandingReveal } from "@/components/landing/landing-reveal";

const STEPS = [
  {
    icon: FileUp,
    step: "01",
    title: "Upload",
    description:
      "Upload a typed PDF, a scanned handout, or a photo of your handwritten notes (up to 100 MB). No signup friction — just pick the file.",
  },
  {
    icon: ScanText,
    step: "02",
    title: "Document processing / OCR",
    description:
      "Typed PDFs are indexed instantly. Scanned and handwritten pages are transcribed page by page — every finished page is saved, so a retry resumes where it stopped.",
  },
  {
    icon: Sparkles,
    step: "03",
    title: "AI study tools",
    description:
      "One click turns the text into chapter summaries, flashcards, quizzes and mind maps powered by a leading AI model.",
  },
  {
    icon: MessageSquareText,
    step: "04",
    title: "Study with your AI tutor",
    description:
      "Drill the flashcards, quiz yourself, trace the mind map, or chat with a tutor that answers from your own notes.",
  },
];

function StepIcon({
  icon: Icon,
  step,
}: {
  icon: React.ElementType;
  step: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 text-cream-50 shadow-sm">
        <Icon className="h-6 w-6" />
      </div>
      <span className="font-display text-5xl font-bold text-cream-300">
        {step}
      </span>
    </div>
  );
}

/**
 * How It Works, matching the real StudyAI workflow:
 * upload → document processing/OCR → AI study tools → study.
 */
export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 bg-cream-100/70 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700">
            How it works
          </span>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            From PDF to prepared in four steps
          </h2>
          <p className="mt-4 text-lg text-ink-600">
            No configuration, no setup. Just upload and start learning.
          </p>
        </LandingReveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <LandingReveal key={step.step} delay={i * 0.1}>
              <div className="h-full rounded-3xl border border-cream-200 bg-card/80 p-6 shadow-sm">
                <StepIcon icon={step.icon} step={step.step} />
                <h3 className="mt-6 font-display text-xl font-semibold text-ink-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  {step.description}
                </p>
              </div>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
}