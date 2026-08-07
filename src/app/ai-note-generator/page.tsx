import type { Metadata } from "next";
import { PenLine } from "lucide-react";
import { SeoToolPage } from "@/components/seo/seo-tool-page";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://study-ai-two-sable.vercel.app";

export const metadata: Metadata = {
  title: "AI Note Generator — Auto-Generated Study Notes",
  description:
    "Auto-generate handwritten-style study notes from your class material — with definitions, tricks, equations, exam questions and one-line revisions. Free.",
  alternates: { canonical: "/ai-note-generator" },
  openGraph: {
    title: "AI Note Generator — StudyAI",
    url: `${baseUrl}/ai-note-generator`,
  },
};

const features = [
  {
    title: "Notes that read like a notebook",
    description:
      "StudyAI formats your notes in a clean, handwritten style — easy to scan, easy to remember, and pleasant to revise from.",
  },
  {
    title: "Built-in memory tricks",
    description:
      "Every chapter includes memorable tricks and mnemonics that help you recall definitions and formulas in the exam hall.",
  },
  {
    title: "Equations kept clear",
    description:
      "Formulas are extracted into clean equation blocks so you can drill them without hunting through paragraphs.",
  },
  {
    title: "Exam questions included",
    description:
      "Each note ends with likely exam questions and a five-mark answer framework so you practice what will actually be asked.",
  },
  {
    title: "From PDFs or handwriting",
    description:
      "Works with typed PDFs, scanned notes and photos of whiteboards — everything is transcribed and then structured into notes.",
  },
  {
    title: "Free forever",
    description:
      "Generate as many notes as you want, free and ad-supported. No subscription, no credit cards.",
  },
];

const steps = [
  {
    step: "01",
    title: "Upload your material",
    description:
      "Add a PDF, a photo of your handwritten notes, or a whiteboard shot. StudyAI reads them all.",
  },
  {
    step: "02",
    title: "Generate your notes",
    description:
      "One click produces structured, handwritten-style notes for every chapter with all the key sections.",
  },
  {
    step: "03",
    title: "Revise fast",
    description:
      "Use the one-line revisions for quick reviews and the exam questions for deep practice before tests.",
  },
];

const faqs = [
  {
    q: "What sections does an AI note include?",
    a: "Each chapter note includes definitions, key things to remember, memory tricks, equations, likely exam questions, a five-mark answer framework, and a one-line revision.",
  },
  {
    q: "Can I use it for any subject?",
    a: "Yes. StudyAI works for any subject you upload — from maths and physics to history, medicine and law.",
  },
  {
    q: "Do I need to type my notes?",
    a: "No. Upload a photo of your handwritten notes or a scanned PDF and StudyAI transcribes it with OCR automatically before generating notes.",
  },
  {
    q: "Is there a free plan?",
    a: "StudyAI is fully free and ad-supported. There are no paid tiers, limits, or subscriptions.",
  },
];

export default function AiNoteGeneratorPage() {
  return (
    <SeoToolPage
      eyebrow="AI Note Generator"
      icon={PenLine}
      title="Auto-generate beautiful, handwritten-style study notes"
      subtitle="Stop rewriting your notes by hand. Upload any PDF or photo and StudyAI structures your material into clean notebook-style notes — with definitions, tricks, equations, exam questions and one-line revisions."
      adSlot="studyai-ai-note-generator"
      features={features}
      steps={steps}
      faqs={faqs}
      softwareSchema={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "StudyAI Note Generator",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        url: `${baseUrl}/ai-note-generator`,
        description:
          "Free AI tool that auto-generates handwritten-style study notes with definitions, tricks, equations and exam questions.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }}
    />
  );
}
