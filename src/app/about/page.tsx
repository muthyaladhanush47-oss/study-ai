import type { Metadata } from "next";
import { LegalPage } from "@/components/seo/legal-page";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://study-ai-two-sable.vercel.app";

export const metadata: Metadata = {
  title: "About — StudyAI",
  description:
    "StudyAI is a free, ad-supported AI study assistant that turns any PDF — typed or handwritten — into summaries, flashcards, quizzes, mind maps and a personal AI tutor.",
  alternates: { canonical: "/about" },
  openGraph: { title: "About — StudyAI", url: `${baseUrl}/about` },
};

const sections = [
  {
    heading: "Our mission",
    body: [
      "Every student deserves great study tools — but the best ones are usually locked behind expensive subscriptions. StudyAI exists to fix that: a genuinely free, ad-supported AI study assistant that turns the notes you already have into the study materials you wish you had.",
    ],
  },
  {
    heading: "What we do",
    body: [
      "Upload any PDF — a textbook chapter, lecture slides, or even a photo of your handwritten notes — and StudyAI reads it for you. Then it generates structured, notebook-style notes, chapter summaries, flashcards, quizzes, mind maps, and answers your questions through a personal AI tutor that remembers your whole conversation.",
      "Everything runs on your own account with private, secure storage. Your notes are never shared or sold.",
    ],
  },
  {
    heading: "Why we're free",
    body: [
      "StudyAI is kept alive by unobtrusive advertising, not subscriptions. There are no paywalls, no credit limits, and no features hidden behind a premium tier. If ads aren't for you, that's fine — the core tools are free either way.",
    ],
  },
  {
    heading: "Our tech",
    body: [
      "StudyAI is built with Next.js, Supabase for storage and authentication, NVIDIA's DeepSeek V4 Flash AI for study tools, and a vision model that transcribes handwriting with OCR.",
    ],
  },
  {
    heading: "Contact us",
    body: [
      "Have feedback, a feature request, or found a bug? We'd love to hear from you — visit our contact page and we'll get back to you as soon as we can.",
    ],
  },
];

export default function AboutPage() {
  return (
    <LegalPage
      title="About StudyAI"
      updated="August 2026"
      sections={sections}
    />
  );
}
