import type { Metadata } from "next";
import { ScanText } from "lucide-react";
import { SeoToolPage } from "@/components/seo/seo-tool-page";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://study-ai-two-sable.vercel.app";

export const metadata: Metadata = {
  title: "Handwriting OCR — Turn Photos of Notes into Text",
  description:
    "Convert photos of handwritten notes, whiteboards and textbook pages into searchable digital text with AI OCR. Free, fast, private.",
  alternates: { canonical: "/ocr" },
  openGraph: { title: "Handwriting OCR — StudyAI", url: `${baseUrl}/ocr` },
};

const features = [
  {
    title: "Reads handwriting",
    description:
      "StudyAI's vision model transcribes handwritten lecture notes, margin labels, and everything in between — capturing the text so it becomes searchable and reusable.",
  },
  {
    title: "Works with photos",
    description:
      "Snap a photo of a whiteboard, a friend's notes, or a textbook page with your phone and upload the JPG, PNG or WebP directly.",
  },
  {
    title: "Handles scanned PDFs too",
    description:
      "Scanned PDFs are rendered page by page and transcribed automatically — no need to convert or re-scan anything.",
  },
  {
    title: "Structure preserved",
    description:
      "Headings, bullet lists, numbered points and formulas are kept in the transcription so your notes stay organised.",
  },
  {
    title: "Searchable and reusable",
    description:
      "After OCR, every tool works: summaries, flashcards, quizzes, mind maps and the AI tutor all use the transcribed text.",
  },
  {
    title: "Private and free",
    description:
      "Your images live in your own secure storage and are never sold or shared. OCR is free with no limits.",
  },
];

const steps = [
  {
    step: "01",
    title: "Take a photo or scan",
    description:
      "Photograph a whiteboard or notebook page, or scan a handout — good lighting makes the transcription more accurate.",
  },
  {
    step: "02",
    title: "Upload the image or PDF",
    description:
      "Upload it to StudyAI (up to 100 MB). Typed and handwritten content is detected automatically.",
  },
  {
    step: "03",
    title: "Read and study",
    description:
      "Once transcribed, your notes become fully searchable and ready for summaries, quizzes, flashcards and chat.",
  },
];

const faqs = [
  {
    q: "How accurate is handwriting OCR?",
    a: "StudyAI uses a leading vision AI model that reads printed and handwritten text very well. For best results, photograph notes with good lighting and steady focus.",
  },
  {
    q: "Which file types are supported?",
    a: "PDFs up to 100 MB, plus JPG, PNG and WebP images. Scanned PDFs and photos are transcribed automatically.",
  },
  {
    q: "Can it read math and formulas?",
    a: "Yes. Formulas and equations are transcribed in plain ASCII/LaTeX notation (like E = mc^2) where they're readable.",
  },
  {
    q: "Is the OCR feature free?",
    a: "Yes. OCR is free and ad-supported — transcribe as many pages as you need with no subscription.",
  },
];

export default function OcrPage() {
  return (
    <SeoToolPage
      eyebrow="Handwriting OCR"
      icon={ScanText}
      title="Turn photos of your notes into searchable text"
      subtitle="Photograph a whiteboard, scan a handout, or upload a picture of your handwritten notes — StudyAI transcribes every page with AI vision, then builds summaries, flashcards and quizzes from it."
      adSlot="studyai-ocr"
      features={features}
      steps={steps}
      faqs={faqs}
      softwareSchema={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "StudyAI OCR",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        url: `${baseUrl}/ocr`,
        description:
          "Free AI OCR tool that transcribes photos of handwritten notes, whiteboards and scanned PDFs into searchable text.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }}
    />
  );
}
