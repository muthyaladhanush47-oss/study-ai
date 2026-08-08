import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  FileUp,
  Layers,
  ListChecks,
  MessageSquareText,
  ScanText,
  Sparkles,
  Star,
  Workflow,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { GoogleAd } from "@/components/ads/google-ad";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingAnimations } from "@/components/landing-animations";

export const metadata: Metadata = {
  title: "StudyAI — AI Study Assistant for PDFs & Handwritten Notes",
  description:
    "Upload any PDF — typed or handwritten — and let AI read it. Get summaries, flashcards, quizzes, mind maps and a personal AI tutor. Free, ad-supported, no subscriptions.",
  alternates: { canonical: "/" },
};

const features = [
  {
    icon: ScanText,
    title: "Reads handwriting",
    description:
      "Scan in your handwritten lecture notes and StudyAI transcribes every page with AI vision — then treats it like a normal PDF.",
  },
  {
    icon: MessageSquareText,
    title: "AI tutor with memory",
    description:
      "Ask questions in plain English. Your tutor remembers the whole conversation and adapts to your learning level and goals.",
  },
  {
    icon: Layers,
    title: "Chapter summaries",
    description:
      "Turn hundreds of pages into concise, chapter-by-chapter overviews with the key points that matter for your exam.",
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
      "Create multiple-choice quizzes with instant feedback and explanations to test yourself before the real thing.",
  },
  {
    icon: Workflow,
    title: "Mind maps",
    description:
      "See the whole topic at a glance with interactive mind maps that help you connect ideas and memorize faster.",
  },
];

const steps = [
  {
    step: "01",
    title: "Upload your PDF",
    description:
      "Drop in lecture slides, textbooks, or a photo of your handwritten notes. We store them privately and index the text instantly.",
  },
  {
    step: "02",
    title: "Generate study tools",
    description:
      "One click turns your notes into summaries, flashcards, quizzes, and mind maps powered by a leading AI model.",
  },
  {
    step: "03",
    title: "Learn and ask",
    description:
      "Chat with the material to clear up confusion, and keep your streak alive with daily practice.",
  },
];

const testimonials = [
  {
    quote:
      "I photographed my entire organic chemistry notebook and StudyAI turned it into notes and flashcards in minutes. It's like having a teaching assistant who never sleeps.",
    name: "Ananya R.",
    role: "Pre-med student",
    initials: "AR",
    accent: "from-primary to-blue-500",
  },
  {
    quote:
      "The AI tutor is the best part. I asked it to explain thermodynamics like I'm 10, and then it quizzed me until I actually understood it. My grades have never been better.",
    name: "Daniel K.",
    role: "Engineering sophomore",
    initials: "DK",
    accent: "from-fuchsia-500 to-purple-500",
  },
  {
    quote:
      "I used to spend hours making notes and mind maps by hand. Now I upload my PDF and have everything ready before my coffee gets cold. Completely free is a bonus.",
    name: "Priya S.",
    role: "Law student",
    initials: "PS",
    accent: "from-amber-500 to-orange-500",
  },
];

const faqs = [
  {
    q: "Can StudyAI really read my handwritten notes?",
    a: "Yes. When you upload a PDF that has no text layer — like a scan of your handwriting — StudyAI automatically runs OCR with a vision AI model, transcribes every page, and stores the text so summaries, flashcards, and chat all work as usual.",
  },
  {
    q: "What AI model does StudyAI use?",
    a: "StudyAI uses Google Gemini 2.5 Flash — a fast, powerful model with a very large context window, which is ideal for summarizing long documents.",
  },
  {
    q: "Is StudyAI really free?",
    a: "Yes. StudyAI is free to use with no subscription. We keep the lights on with unobtrusive ads. You can remove or customize ads once you have your own AdSense account.",
  },
  {
    q: "Are my documents private?",
    a: "Your files are stored in your own Supabase bucket with row-level security, and every AI request is authenticated to your account. We never sell or share your notes.",
  },
  {
    q: "Which file types are supported?",
    a: "PDF files up to 20 MB. Typed PDFs are processed instantly; scanned or handwritten PDFs are transcribed with OCR automatically.",
  },
];

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "StudyAI",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://study-ai-two-sable.vercel.app",
  description:
    "AI study assistant that turns any PDF — typed or handwritten — into summaries, flashcards, quizzes, mind maps and a personal AI tutor. Free and ad-supported.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "120",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={softwareSchema} />
      <JsonLd data={faqSchema} />

      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-fuchsia-600 text-white">
              <BookOpenCheck className="h-4 w-4" />
            </span>
            <span className="font-heading text-lg font-bold tracking-tight">
              Study
              <span className="text-gradient">AI</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
            <a href="#features" className="transition hover:text-foreground">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-foreground">
              How it works
            </a>
            <a href="#testimonials" className="transition hover:text-foreground">
              Loved by students
            </a>
            <a href="#faq" className="transition hover:text-foreground">
              FAQ
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
          <div className="absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl dark:bg-primary/10" />
          <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <LandingAnimations>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Reads handwriting · Free forever · No subscription
                </span>
                <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
                  Turn your PDF notes into{" "}
                  <span className="text-gradient">study superpowers</span>
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                  Upload a PDF — even a photo of your handwritten notes — and get
                  summaries, flashcards, quizzes, mind maps, and an AI tutor that
                  answers from your own material.
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
                <div className="mt-12 grid grid-cols-3 gap-4 border-t border-border pt-8">
                  {[
                    ["Unlimited", "document uploads"],
                    ["Free", "supported by ads"],
                    ["100%", "private by default"],
                  ].map(([value, label]) => (
                    <div key={label} className="text-center">
                      <div className="text-xl font-bold sm:text-2xl">{value}</div>
                      <div className="text-xs text-muted-foreground sm:text-sm">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </LandingAnimations>
            </div>
          </div>
        </section>

        <GoogleAd slot="studyai-landing" format="auto" className="mx-auto max-w-6xl px-4 sm:px-6" />

        {/* Features */}
        <section
          id="features"
          className="border-t border-border bg-muted/40 py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to study smarter
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                One upload. Six study tools. Built for students, not giant platforms.
              </p>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-fuchsia-600 group-hover:text-white">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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
              <p className="mt-4 text-lg text-muted-foreground">
                No configuration, no setup. Just upload and start learning.
              </p>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.step} className="relative">
                  <div className="text-5xl font-black text-primary/15">
                    {step.step}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Loved by students everywhere
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Thousands of students study smarter with StudyAI every day.
              </p>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure
                  key={t.name}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <div>
                    <div className="flex gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <blockquote className="mt-4 text-sm leading-relaxed text-foreground/90">
                      “{t.quote}”
                    </blockquote>
                  </div>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.accent} text-sm font-bold text-white`}
                    >
                      {t.initials}
                    </span>
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.role}
                      </div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-border bg-muted/40 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Frequently asked questions
              </h2>
            </div>
            <div className="mt-12 space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                    {faq.q}
                    <span className="text-muted-foreground transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-fuchsia-600 to-violet-600 px-6 py-16 text-center text-white sm:px-16">
              <div className="absolute inset-0 bg-grid opacity-20" />
              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Your next exam, handled.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
                  Create your free account and turn your notes — typed or
                  handwritten — into a personal AI study system in under a minute.
                </p>
                <Link href="/signup" className="mt-8 inline-block">
                  <Button
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90"
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

      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-fuchsia-600 text-white">
                  <BookOpenCheck className="h-3 w-3" />
                </span>
                <span className="font-heading text-sm font-semibold">
                  Study<span className="text-gradient">AI</span>
                </span>
              </div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Turn any PDF — typed or handwritten — into summaries, flashcards,
                quizzes, mind maps and an AI tutor. Free and ad-supported.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Product</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {[
                  ["/notes", "AI Notes"],
                  ["/pdf-summarizer", "PDF Summarizer"],
                  ["/ocr", "Handwriting OCR"],
                  ["/flashcards", "Flashcards"],
                  ["/mindmap", "Mind Maps"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="transition hover:text-foreground">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Company</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {[
                  ["/about", "About"],
                  ["/contact", "Contact"],
                  ["/blog", "Study Tips Blog"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="transition hover:text-foreground">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Legal</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {[
                  ["/privacy", "Privacy Policy"],
                  ["/terms", "Terms & Conditions"],
                  ["/disclaimer", "Disclaimer"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="transition hover:text-foreground">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} StudyAI. Study smarter with AI · Free and
            ad-supported · Powered by Next.js, Supabase & Gemini
          </div>
        </div>
      </footer>
    </div>
  );
}
