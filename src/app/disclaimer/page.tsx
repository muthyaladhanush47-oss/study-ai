import type { Metadata } from "next";
import { LegalPage } from "@/components/seo/legal-page";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://study-ai-two-sable.vercel.app";

export const metadata: Metadata = {
  title: "Disclaimer — StudyAI",
  description:
    "Important disclaimer about AI-generated study content on StudyAI. AI output can contain errors; always verify against your official course materials.",
  alternates: { canonical: "/disclaimer" },
  openGraph: { title: "Disclaimer — StudyAI", url: `${baseUrl}/disclaimer` },
};

const sections = [
  {
    heading: "AI-generated study content",
    body: [
      "StudyAI uses artificial intelligence to generate notes, summaries, flashcards, quizzes, mind maps, and tutor answers. While we aim for high-quality output, AI-generated content can contain errors, inaccuracies, or omissions, and it should never be treated as an authoritative source.",
    ],
  },
  {
    heading: "Not a substitute for official materials",
    body: [
      "The study tools we generate are a supplement to, not a replacement for, your textbooks, lectures, and official course materials. Always rely on your teacher, lecturer, and prescribed readings for the final word on any topic — especially where your grades are concerned.",
    ],
  },
  {
    heading: "Educational use only",
    body: [
      "StudyAI is intended to support personal study and revision. It is not professional educational advice, tutoring, or academic guidance of the kind provided by qualified educators. If you need structured academic support, consult your institution's teachers or academic advisors.",
    ],
  },
  {
    heading: "No warranties",
    body: [
      "StudyAI is provided 'as is' without warranties of accuracy, completeness, or fitness for a particular purpose. We make no guarantee that any study tool will match your exam syllabus, marking scheme, or teacher's expectations.",
    ],
  },
  {
    heading: "External links",
    body: [
      "The site may link to third-party websites. We are not responsible for the content, accuracy, or policies of any external sites.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "If you find an error in any generated content, we'd love to know — email support@studyai.app and we'll review it.",
    ],
  },
];

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Disclaimer"
      updated="August 2026"
      sections={sections}
    />
  );
}
