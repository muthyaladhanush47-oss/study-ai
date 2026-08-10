import type { Metadata } from "next";
import { GoogleAd } from "@/components/ads/google-ad";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingMarquee } from "@/components/landing/landing-marquee";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingReviews } from "@/components/landing/landing-reviews";
import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "StudyAI — AI Study Assistant for PDFs & Handwritten Notes",
  description:
    "Upload any PDF — typed or handwritten — and let AI read it. Get summaries, flashcards, quizzes, mind maps and a personal AI tutor. Free, ad-supported, no subscriptions.",
  alternates: { canonical: "/" },
};

const faqs = [
  {
    q: "Can StudyAI really read my handwritten notes?",
    a: "Yes. When you upload a PDF that has no text layer — like a scan of your handwriting — StudyAI runs OCR with a vision AI model, transcribes every page, and stores the text so summaries, flashcards and chat all work as usual.",
  },
  {
    q: "What AI models does StudyAI use?",
    a: "Text AI — summaries, flashcards, quizzes, mind maps and the tutor — runs on NVIDIA's DeepSeek V4 Flash. Handwriting OCR runs on a separate Gemini vision model.",
  },
  {
    q: "Is StudyAI really free?",
    a: "Yes. StudyAI is free to use with no subscription. We keep the lights on with unobtrusive ads.",
  },
  {
    q: "How large can my uploads be?",
    a: "PDFs, JPGs, PNGs and WebP images up to 100 MB are supported. Typed PDFs are indexed instantly; scanned or handwritten files are transcribed with OCR automatically.",
  },
  {
    q: "Are my documents private?",
    a: "Your files are stored in your own Supabase bucket with row-level security, and every AI request is authenticated to your account. We never sell or share your notes, and third-party AI providers process your content only to generate the study tools you request.",
  },
  {
    q: "What if a long PDF doesn't finish in one run?",
    a: "Pages are processed one at a time and each finished page is saved immediately. If a run times out or fails, your completed pages are kept and re-running OCR resumes from the first unfinished page.",
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

/**
 * Marketing landing page, available to unauthenticated visitors. The
 * authenticated StudyAI application lives behind /login and /dashboard and is
 * untouched — this page only links into it through the real auth routes.
 */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream-50">
      <JsonLd data={softwareSchema} />
      <JsonLd data={faqSchema} />

      <LandingNavbar />

      <main className="flex-1">
        <LandingHero />
        <LandingMarquee />
        <LandingFeatures />

        <GoogleAd
          slot="studyai-landing"
          format="auto"
          className="mx-auto max-w-6xl px-4 py-6 sm:px-6"
        />

        <LandingHowItWorks />
        <LandingReviews />
        <LandingFaq />
        <LandingCta />
      </main>

      <LandingFooter />
    </div>
  );
}