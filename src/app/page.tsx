import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  FileUp,
  Layers,
  ListChecks,
  MessageSquareText,
  Moon,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FileUp,
    title: "Upload PDF notes",
    description:
      "Securely upload any lecture PDF. We extract the text and index it instantly in your private workspace.",
  },
  {
    icon: MessageSquareText,
    title: "Chat with your notes",
    description:
      "Ask questions in plain English and get answers grounded in your own material — like having a tutor on call.",
  },
  {
    icon: Layers,
    title: "Chapter summaries",
    description:
      "Turn hundreds of pages into concise, chapter-by-chapter overviews with the key points that matter.",
  },
  {
    icon: Brain,
    title: "Flashcard generator",
    description:
      "Generate ready-to-review flashcards from any document and drill them with a flip-card deck.",
  },
  {
    icon: ListChecks,
    title: "Quiz generator",
    description:
      "Create multiple-choice quizzes with explanations to test yourself before the real exam.",
  },
  {
    icon: Moon,
    title: "Study anywhere",
    description:
      "Dark mode, fully mobile responsive, and fast on any device. Your entire study stack in one place.",
  },
];

const steps = [
  {
    step: "01",
    title: "Upload your PDF",
    description:
      "Drop in lecture slides, textbooks, or notes. Your files are stored privately in Supabase.",
  },
  {
    step: "02",
    title: "Generate study tools",
    description:
      "One click turns your notes into summaries, flashcards, and practice quizzes powered by OpenRouter.",
  },
  {
    step: "03",
    title: "Learn and ask",
    description:
      "Chat with the material to clear up confusion and revisit flashcard decks until it sticks.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-violet-600 text-white">
              <BookOpenCheck className="h-4 w-4" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              Study<span className="text-brand-600 dark:text-brand-400">AI</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-300 sm:flex">
            <a href="#features" className="transition hover:text-zinc-900 dark:hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-zinc-900 dark:hover:text-white">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Get started <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_40%,transparent_75%)]" />
          <div className="absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl dark:bg-brand-500/10" />
          <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300">
                <Sparkles className="h-3.5 w-3.5" />
                AI-powered studying, reimagined
              </span>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
                Turn your PDF notes into{" "}
                <span className="text-gradient">study superpowers</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
                Upload a PDF and get instant chapter summaries, flashcards, practice
                quizzes, and a chatbot that answers questions from your own material.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start studying free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Log in to your account
                  </Button>
                </Link>
              </div>
              <div className="mt-12 grid grid-cols-3 gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-800">
                {[
                  ["Unlimited", "document uploads"],
                  ["Free", "generations on signup"],
                  ["100%", "private by default"],
                ].map(([value, label]) => (
                  <div key={label} className="text-center">
                    <div className="text-xl font-bold sm:text-2xl">{value}</div>
                    <div className="text-xs text-zinc-500 sm:text-sm">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-zinc-200 bg-zinc-50 py-20 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to study smarter
              </h2>
              <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                One upload. Four study tools. Built for students, not giant platforms.
              </p>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-brand-700"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-950 dark:text-brand-400 dark:group-hover:bg-brand-600 dark:group-hover:text-white">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                From PDF to prepared in three steps
              </h2>
              <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                No configuration, no setup. Just upload and start learning.
              </p>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.step} className="relative">
                  <div className="text-5xl font-black text-brand-100 dark:text-zinc-800">
                    {step.step}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-zinc-200 py-20 dark:border-zinc-800">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 px-6 py-16 text-center text-white sm:px-16">
              <div className="absolute inset-0 bg-grid opacity-20" />
              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Your next exam, handled.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">
                  Create your free account and turn your notes into a personal AI
                  study system in under a minute.
                </p>
                <Link href="/signup" className="mt-8 inline-block">
                  <Button
                    size="lg"
                    className="bg-white text-brand-700 shadow-lg hover:bg-brand-50"
                  >
                    Create free account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand-600 to-violet-600 text-white">
              <BookOpenCheck className="h-3 w-3" />
            </span>
            <span className="text-sm font-semibold">
              Study<span className="text-brand-600 dark:text-brand-400">AI</span>
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Study smarter with AI. Powered by Next.js, Supabase & OpenRouter.
          </p>
        </div>
      </footer>
    </div>
  );
}
