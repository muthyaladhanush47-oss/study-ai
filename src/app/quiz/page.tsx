import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import { SeoToolPage } from "@/components/seo/seo-tool-page";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://study-ai-two-sable.vercel.app";

export const metadata: Metadata = {
  title: "AI Practice Quiz — Generate Questions from Any PDF",
  description:
    "Turn any PDF or handwritten notes into a practice quiz — multiple choice, true/false, fill-in-the-blank and short answer. Free, no subscription.",
  alternates: { canonical: "/quiz" },
  openGraph: { title: "AI Practice Quiz — StudyAI", url: `${baseUrl}/quiz` },
};

const features = [
  {
    title: "Quizzes from any PDF",
    description:
      "Upload your material and StudyAI generates a 10-question quiz covering the key ideas — the same questions you would want before an exam.",
  },
  {
    title: "Four question styles",
    description:
      "Each quiz mixes multiple choice, true/false, fill-in-the-blank and short answer so you practice recalling and applying, not just recognising.",
  },
  {
    title: "Instant feedback",
    description:
      "Submit an answer and see right away whether you got it — with an explanation or the correct answer on every question.",
  },
  {
    title: "Works with handwriting",
    description:
      "Photos of handwritten notes and scanned PDFs are transcribed with OCR, then quizzed like any typed document.",
  },
  {
    title: "Retry and review",
    description:
      "Retake the quiz as many times as you like, or review the questions again after you finish to cement the material.",
  },
  {
    title: "Free and unlimited",
    description:
      "Create and take as many quizzes as you want — free, ad-supported, no subscriptions.",
  },
];

const steps = [
  {
    step: "01",
    title: "Upload your PDF or photo",
    description:
      "Add a PDF, a lecture slide, or a photo of your handwritten notes. Max 20 MB, processed instantly.",
  },
  {
    step: "02",
    title: "Generate the quiz",
    description:
      "One click creates a 10-question quiz tuned to the key facts in your material.",
  },
  {
    step: "03",
    title: "Test and improve",
    description:
      "Answer, get instant feedback, and retake until the material sticks — then pair the quiz with flashcards and a mind map.",
  },
];

const faqs = [
  {
    q: "What kinds of questions does the quiz include?",
    a: "StudyAI mixes multiple choice, true/false, fill-in-the-blank and short answer questions so you practise recalling the material, not just recognising an option.",
  },
  {
    q: "Can I quiz my handwriting?",
    a: "Yes. Upload a photo or scanned PDF and StudyAI transcribes it with OCR first, then builds the quiz from the text.",
  },
  {
    q: "Is the quiz generator free?",
    a: "Yes. Quiz generation and practice are completely free and supported by unobtrusive ads.",
  },
  {
    q: "Do quizzes work for any subject?",
    a: "Yes — from anatomy to programming to languages, StudyAI tests the most exam-relevant facts in whatever you upload.",
  },
];

export default function QuizPage() {
  return (
    <SeoToolPage
      eyebrow="AI Practice Quiz"
      icon={ListChecks}
      title="Turn any PDF into a practice quiz"
      subtitle="Upload a PDF or a photo of your handwritten notes and StudyAI generates a practice quiz — multiple choice, true/false, fill-in-the-blank and short answer — with instant feedback. Free, unlimited, and ready when exams are."
      adSlot="studyai-quiz"
      features={features}
      steps={steps}
      faqs={faqs}
      softwareSchema={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "StudyAI Practice Quiz",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        url: `${baseUrl}/quiz`,
        description:
          "Free AI tool that turns PDFs and handwritten notes into practice quizzes with instant feedback.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }}
    />
  );
}