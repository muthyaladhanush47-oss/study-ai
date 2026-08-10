import type { Metadata } from "next";
import { NotebookPen } from "lucide-react";
import { SeoToolPage } from "@/components/seo/seo-tool-page";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://study-ai-two-sable.vercel.app";

export const metadata: Metadata = {
  title: "AI Notes Generator — Turn Any PDF into Study Notes",
  description:
    "Generate beautiful, structured study notes from any PDF — definitions, tricks, equations, exam questions and one-line revisions — free and ad-supported.",
  alternates: { canonical: "/notes" },
  openGraph: { title: "AI Notes Generator — StudyAI", url: `${baseUrl}/notes` },
};

const features = [
  {
    title: "Chapter-by-chapter notes",
    description:
      "Your PDF is split into chapters automatically, and each one becomes a focused study note with the most exam-relevant content.",
  },
  {
    title: "Handwritten-style layout",
    description:
      "Notes are styled like a clean notebook — with definitions, memory tricks, equations and margin highlights that are easy to scan before an exam.",
  },
  {
    title: "Exam-ready structure",
    description:
      "Every chapter includes likely exam questions, five-mark answer frameworks, and a one-line revision to recap in seconds.",
  },
  {
    title: "Works with handwriting too",
    description:
      "Upload a photo of your handwritten notes or a scanned PDF and StudyAI transcribes it with OCR before generating notes.",
  },
  {
    title: "Regenerate anytime",
    description:
      "Not happy with a chapter? Regenerate the notes to get a fresh take with the same sections.",
  },
  {
    title: "Private by default",
    description:
      "Your documents live in your own secure storage with row-level security. We never share or sell your notes.",
  },
];

const steps = [
  {
    step: "01",
    title: "Upload your PDF or photo",
    description:
      "Drop in lecture slides, a textbook chapter, or a photo of your handwritten notes. Max 100 MB, no sign-up friction.",
  },
  {
    step: "02",
    title: "Generate AI notes",
    description:
      "One click creates structured, handwritten-style notes for every chapter — definitions, tricks, equations, and exam questions.",
  },
  {
    step: "03",
    title: "Review and revise",
    description:
      "Read the one-line revisions, drill the exam questions, and use the notes alongside flashcards and quizzes.",
  },
];

const faqs = [
  {
    q: "What do AI notes look like?",
    a: "StudyAI formats each chapter as a notebook page with labeled sections: definitions, things to remember, memory tricks, equations, likely exam questions, a five-mark answer framework, and a one-line revision.",
  },
  {
    q: "Can it handle long PDFs?",
    a: "Yes. StudyAI is built on a large-context AI model that summarizes long documents chapter by chapter without losing the key points.",
  },
  {
    q: "Does it work with handwritten notes?",
    a: "Yes. Photos and scanned PDFs are transcribed automatically with OCR, then the AI generates the same structured notes from the text.",
  },
  {
    q: "Is the notes generator free?",
    a: "Yes. Note generation is free and supported by unobtrusive ads. There are no subscriptions and no credit limits.",
  },
];

export default function NotesPage() {
  return (
    <SeoToolPage
      eyebrow="AI Notes Generator"
      icon={NotebookPen}
      title="Turn any PDF into beautiful AI study notes"
      subtitle="Upload a PDF or a photo of your handwritten notes and get chapter-by-chapter study notes — definitions, memory tricks, equations, exam questions and one-line revisions — formatted like a clean notebook."
      adSlot="studyai-notes"
      features={features}
      steps={steps}
      faqs={faqs}
      softwareSchema={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "StudyAI Notes Generator",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        url: `${baseUrl}/notes`,
        description:
          "Free AI tool that turns any PDF or photo of handwritten notes into structured, exam-ready study notes.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }}
    />
  );
}
