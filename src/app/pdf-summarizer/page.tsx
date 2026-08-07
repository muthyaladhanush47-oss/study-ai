import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { SeoToolPage } from "@/components/seo/seo-tool-page";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://study-ai-two-sable.vercel.app";

export const metadata: Metadata = {
  title: "Free PDF Summarizer — AI Summary of Any PDF",
  description:
    "Summarize long PDFs — textbooks, research papers, lecture notes — into concise, chapter-by-chapter summaries with key points. Free, no subscription.",
  alternates: { canonical: "/pdf-summarizer" },
  openGraph: {
    title: "Free PDF Summarizer — StudyAI",
    url: `${baseUrl}/pdf-summarizer`,
  },
};

const features = [
  {
    title: "Summarizes any PDF",
    description:
      "Lecture slides, textbook chapters, research papers — get a clear overview plus chapter summaries that highlight what actually matters.",
  },
  {
    title: "Key points, extracted",
    description:
      "Every chapter summary ends with the key points so you can revise the essentials in minutes instead of rereading hundreds of pages.",
  },
  {
    title: "Handles scans and handwriting",
    description:
      "Scanned PDFs and photos of handwritten notes are transcribed with AI OCR first, then summarized like any typed document.",
  },
  {
    title: "No page limits on length",
    description:
      "Built on a large-context AI model, StudyAI keeps the full document in mind while summarizing, so nothing important is dropped.",
  },
  {
    title: "Free and unlimited",
    description:
      "Summarize as many PDFs as you like. No credits, no subscriptions — just unobtrusive ads.",
  },
  {
    title: "Your files stay private",
    description:
      "Documents are stored in your own secure bucket with row-level security and are never shared.",
  },
];

const steps = [
  {
    step: "01",
    title: "Upload your PDF",
    description:
      "Drop in your file (up to 20 MB) — typed PDFs are indexed instantly, scanned ones are OCR'd automatically.",
  },
  {
    step: "02",
    title: "Get the summary",
    description:
      "One click generates an overview and chapter-by-chapter summaries with key points, in your preferred learning level.",
  },
  {
    step: "03",
    title: "Go deeper",
    description:
      "Turn the same document into flashcards, quizzes and mind maps, or ask the AI tutor anything about it.",
  },
];

const faqs = [
  {
    q: "How accurate is the PDF summary?",
    a: "StudyAI keeps the full document in context while summarizing, producing accurate, chapter-by-chapter overviews with key points. You can always open the original file to verify.",
  },
  {
    q: "Can it summarize scanned or handwritten PDFs?",
    a: "Yes. When a PDF has no text layer, StudyAI runs OCR with a vision AI model to transcribe every page before summarizing.",
  },
  {
    q: "What PDFs can I upload?",
    a: "Any PDF up to 20 MB — textbooks, lecture notes, research papers, slides and more. Images (JPG, PNG, WebP) are also supported.",
  },
  {
    q: "Is the PDF summarizer really free?",
    a: "Yes. Summarizing is completely free and ad-supported, with no subscription and no word or page limits.",
  },
];

export default function PdfSummarizerPage() {
  return (
    <SeoToolPage
      eyebrow="Free PDF Summarizer"
      icon={FileText}
      title="Turn long PDFs into clear, chapter-by-chapter summaries"
      subtitle="Upload a textbook, lecture notes or research paper and get a concise overview plus per-chapter summaries with key points — in under a minute, completely free."
      adSlot="studyai-pdf-summarizer"
      features={features}
      steps={steps}
      faqs={faqs}
      softwareSchema={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "StudyAI PDF Summarizer",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        url: `${baseUrl}/pdf-summarizer`,
        description:
          "Free AI tool that summarizes long PDFs into chapter-by-chapter study summaries with key points.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }}
    />
  );
}
