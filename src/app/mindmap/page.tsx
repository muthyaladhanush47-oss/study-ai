import type { Metadata } from "next";
import { Workflow } from "lucide-react";
import { SeoToolPage } from "@/components/seo/seo-tool-page";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://study-ai-two-sable.vercel.app";

export const metadata: Metadata = {
  title: "AI Mind Maps — Visualize Any Topic from Your Notes",
  description:
    "Turn any PDF or handwritten notes into interactive mind maps that show how concepts connect. Free, no subscription, private.",
  alternates: { canonical: "/mindmap" },
  openGraph: { title: "AI Mind Maps — StudyAI", url: `${baseUrl}/mindmap` },
};

const features = [
  {
    title: "One-click mind maps",
    description:
      "Upload your material and StudyAI builds an interactive mind map of the topic — central idea, branches, and sub-concepts — automatically.",
  },
  {
    title: "See the big picture",
    description:
      "Mind maps surface how concepts relate to each other, making it easier to understand the structure of a subject and recall it under pressure.",
  },
  {
    title: "Interactive navigation",
    description:
      "Pan, zoom and explore the map. Click branches to drill into sub-concepts without losing your place.",
  },
  {
    title: "From handwriting too",
    description:
      "Photos of notes and scanned PDFs are OCR'd first, then turned into a map — your whiteboard becomes a visual study guide.",
  },
  {
    title: "Great before exams",
    description:
      "A glance at a well-made mind map is the fastest way to refresh a whole chapter minutes before the exam begins.",
  },
  {
    title: "Free and private",
    description:
      "Mind maps are free to generate, ad-supported, and your documents stay in your private storage.",
  },
];

const steps = [
  {
    step: "01",
    title: "Upload your notes",
    description:
      "Add a PDF or photo of your handwritten notes. StudyAI reads typed and handwritten content alike.",
  },
  {
    step: "02",
    title: "Generate the map",
    description:
      "One click turns your document into an interactive mind map with the main topic at the center and related concepts branching out.",
  },
  {
    step: "03",
    title: "Explore and connect",
    description:
      "Zoom around the map, follow branches, and use it alongside flashcards and quizzes to build strong mental connections.",
  },
];

const faqs = [
  {
    q: "What does an AI mind map look like?",
    a: "StudyAI places your document's main topic at the center, then branches into core themes, each with its own sub-concepts — all interactive and zoomable.",
  },
  {
    q: "Can I make a mind map from my handwriting?",
    a: "Yes. Upload a photo or scanned PDF and StudyAI transcribes it with OCR before building the map.",
  },
  {
    q: "Are mind maps free?",
    a: "Yes — generating and exploring mind maps is completely free and supported by unobtrusive ads.",
  },
  {
    q: "Do mind maps help with studying?",
    a: "Mind maps improve understanding and recall by showing relationships between concepts, which is why they're a favourite revision tool for visual learners.",
  },
];

export default function MindmapPage() {
  return (
    <SeoToolPage
      eyebrow="AI Mind Maps"
      icon={Workflow}
      title="See your whole subject at a glance with AI mind maps"
      subtitle="Upload a PDF or photo of your notes and StudyAI builds an interactive mind map — central topic, branches, and connections — so you understand and remember the structure of any subject."
      adSlot="studyai-mindmap"
      features={features}
      steps={steps}
      faqs={faqs}
      softwareSchema={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "StudyAI Mind Maps",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        url: `${baseUrl}/mindmap`,
        description:
          "Free AI tool that turns PDFs and handwritten notes into interactive, zoomable mind maps.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }}
    />
  );
}
