import type { Metadata } from "next";
import { Layers } from "lucide-react";
import { SeoToolPage } from "@/components/seo/seo-tool-page";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://study-ai-two-sable.vercel.app";

export const metadata: Metadata = {
  title: "AI Flashcards — Generate Flashcard Decks from Any PDF",
  description:
    "Turn any PDF or handwritten notes into flashcard decks automatically and drill them with a flip-card deck. Free, no subscription.",
  alternates: { canonical: "/flashcards" },
  openGraph: { title: "AI Flashcards — StudyAI", url: `${baseUrl}/flashcards` },
};

const features = [
  {
    title: "Instant decks from any PDF",
    description:
      "Upload your material and StudyAI generates a full flashcard deck — definitions, concepts, formulas and key facts — in one click.",
  },
  {
    title: "Flip-card review",
    description:
      "Drill the deck with a smooth flip-card interface. Check what you know, mark cards, and keep going until it sticks.",
  },
  {
    title: "Works with handwriting",
    description:
      "Photos of handwritten notes and scanned PDFs are transcribed with OCR, then converted into flashcards like any typed document.",
  },
  {
    title: "Active recall built in",
    description:
      "Flashcards force you to retrieve the answer before flipping — proven to be far more effective than passive rereading.",
  },
  {
    title: "Regenerate anytime",
    description:
      "Want more cards or a different angle? Regenerate the deck to get a fresh set from the same notes.",
  },
  {
    title: "Free and unlimited",
    description:
      "Create and review as many decks as you like — free, ad-supported, no subscriptions.",
  },
];

const steps = [
  {
    step: "01",
    title: "Upload your notes",
    description:
      "Add a PDF or a photo of your handwritten notes. Max 20 MB, processed instantly.",
  },
  {
    step: "02",
    title: "Generate the deck",
    description:
      "One click creates front-and-back flashcards covering the most important concepts in your material.",
  },
  {
    step: "03",
    title: "Drill and master",
    description:
      "Flip through the deck, test yourself, and pair it with quizzes and mind maps for complete review.",
  },
];

const faqs = [
  {
    q: "How many flashcards do I get?",
    a: "StudyAI generates a deck that covers the key concepts in your document — typically 10-20 cards per document, and you can regenerate for a fresh set anytime.",
  },
  {
    q: "Can I make flashcards from my handwriting?",
    a: "Yes. Upload a photo or scanned PDF and StudyAI transcribes it with OCR first, then builds the deck from the text.",
  },
  {
    q: "Are flashcards free?",
    a: "Yes. Deck generation and review are completely free and supported by unobtrusive ads.",
  },
  {
    q: "Do flashcards work for any subject?",
    a: "Yes — from anatomy to programming to languages, StudyAI extracts the facts worth drilling for whatever you upload.",
  },
];

export default function FlashcardsPage() {
  return (
    <SeoToolPage
      eyebrow="AI Flashcards"
      icon={Layers}
      title="Turn any PDF into a flashcard deck in one click"
      subtitle="Upload a PDF or a photo of your handwritten notes and StudyAI generates a ready-to-review flashcard deck with a smooth flip-card review mode. Free, unlimited, and proven to boost retention."
      adSlot="studyai-flashcards"
      features={features}
      steps={steps}
      faqs={faqs}
      softwareSchema={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "StudyAI Flashcards",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        url: `${baseUrl}/flashcards`,
        description:
          "Free AI tool that turns PDFs and handwritten notes into flashcard decks with flip-card review.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }}
    />
  );
}
