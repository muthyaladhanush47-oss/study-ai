import type { Metadata } from "next";
import { LegalPage } from "@/components/seo/legal-page";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://study-ai-two-sable.vercel.app";

export const metadata: Metadata = {
  title: "Privacy Policy — StudyAI",
  description:
    "How StudyAI collects, uses, and protects your data — including documents, AI processing, analytics, cookies and advertising. We never sell your data.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Privacy Policy — StudyAI", url: `${baseUrl}/privacy` },
};

const sections = [
  {
    heading: "The short version",
    body: [
      "StudyAI is a free, ad-supported study assistant. Your uploaded documents stay private to your account: we do not sell your personal information or your notes, and your files are stored in your own private, access-controlled storage.",
      "Like most websites, StudyAI does use third-party services to run and fund the site. That means some of your data touches providers such as our hosting and database (Supabase), AI processing partners, analytics (Google Analytics), and advertising (Google AdSense). This policy explains exactly what is collected, where it goes, and how you can control it.",
    ],
  },
  {
    heading: "Information we collect",
    body: [
      "The only personal information you provide is what you give us when you create an account. Everything else is information you ask us to process for you.",
    ],
    bullets: [
      "Account information — the email address and display name you provide when you sign up. Authentication and credential handling are provided by our authentication provider, Supabase Auth.",
      "Uploaded documents — the PDFs, photos and images you upload, including handwritten notes, scans and whiteboard photos. These are stored in your private storage bucket with row-level security so only your account can access them.",
      "Extracted and generated content — text extracted from your documents (including OCR transcriptions), plus generated summaries, flashcards, quizzes, mind maps and chat sessions, stored on your account so your study tools persist.",
      "Study activity — records of your study sessions (document counts, tools used, streak and study time, quiz scores) so we can show you progress and analytics.",
      "Usage and analytics data — non-identifying technical data such as page views and how the site is used, collected via Google Analytics.",
      "Advertising data — the advertising network (Google AdSense) may set cookies or similar technologies, as described below, to serve and measure ads.",
    ],
  },
  {
    heading: "How we use your information",
    body: [
      "We use your uploaded content only to provide the study tools you ask for: OCR transcription of handwritten or scanned pages, summaries, flashcards, quizzes, mind maps, and answers from your AI tutor.",
      "We use account and study-activity data to authenticate you, display your dashboard and analytics, keep the service secure, and improve the site.",
      "We do not use your documents or study data to train or improve the AI models themselves.",
    ],
  },
  {
    heading: "How we share your information",
    body: [
      "We never sell your personal information or your notes. To operate the service we rely on the following categories of third-party providers, each bound by confidentiality and their own privacy obligations:",
    ],
    bullets: [
      "Storage, hosting and authentication (Supabase) — stores your documents, account data and study activity with access controls scoped to your account.",
      "AI processing — text is processed by NVIDIA's DeepSeek V4 Flash AI for summaries, flashcards, quizzes, mind maps and chat; handwriting and scanned pages are transcribed by a vision AI model. Your content is sent to these providers only to fulfill your requests.",
      "Analytics (Google Analytics) — receives aggregate, generally non-identifying usage data to help us understand how the site is used.",
      "Advertising (Google AdSense) — may serve ads based on cookies or similar technologies, as described below.",
    ],
  },
  {
    heading: "Cookies and similar technologies",
    body: [
      "We use cookies and similar technologies for three purposes:",
    ],
    bullets: [
      "Essential cookies — required to keep you signed in and to operate the site. These cannot be turned off through our site and do not require consent to function.",
      "Analytics — Google Analytics uses cookies to measure how visitors use the site. Data collected is used to understand traffic and improve the product.",
      "Advertising — if we display advertising through Google AdSense, its cookies and similar technologies are used to serve relevant ads, prevent fraud and measure ad performance. These cookies and the resulting personalized ads are subject to your advertising preferences.",
    ],
  },
  {
    heading: "Advertising and consent (EEA, UK, Switzerland)",
    body: [
      "Personalized advertising and consent-based analytics are subject to local law — for example in the European Economic Area (EEA), the United Kingdom and Switzerland, where they may only run after users make a genuine choice about consent. StudyAI is working toward showing these choices through a consent management platform (CMP) certified by Google, configured in the Google AdSense dashboard.",
      "Once consent controls are live, you will be able to accept, decline, or manage your options, and change your choice at any time. We do not use dark patterns to push consent. Declining consent will not prevent you from using the core study tools; it simply means ads and analytics that require consent will not run for you.",
      "Consent controls for these regions are not yet displayed on the site. Until they are, advertising and analytics cookies for users in these regions are not used.",
    ],
  },
  {
    heading: "Data retention",
    body: [
      "Your documents and account data are kept until you delete them.",
      "You can delete any individual document from your dashboard at any time, and you can request deletion of your entire account — including all uploaded files, extracted text, generated study tools and chat history — by contacting us. We aim to process account-deletion requests promptly.",
      "Advertising and analytics cookies expire automatically or remain until you clear them through your browser.",
    ],
  },
  {
    heading: "Security",
    body: [
      "We use reasonable technical and organisational measures to protect your information, including encrypted storage, authentication on every request, and access controls that keep documents scoped to your account (row-level security). No method of transmission or storage is 100% secure, so we cannot guarantee absolute security.",
    ],
  },
  {
    heading: "Children's privacy",
    body: [
      "StudyAI is intended for users who are at least 13 years old, and accounts must be at least 13 to use the service. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal information, contact us and we will delete it.",
    ],
  },
  {
    heading: "Your rights",
    body: [
      "Depending on your location (including under the GDPR in the EEA/UK and similar laws), you may have the right to access, correct, export, or delete your personal information, and to object to or restrict certain processing, including advertising and analytics.",
      "You can exercise some rights directly — such as deleting documents from your dashboard. For anything else, including deleting your account, contact us and we will respond within a reasonable time, usually 30 days.",
    ],
  },
  {
    heading: "Third-party links",
    body: [
      "The site may link to external websites. We are not responsible for the content, accuracy, or privacy practices of external sites. This policy applies only to StudyAI.",
    ],
  },
  {
    heading: "Changes to this policy",
    body: [
      "We may update this Privacy Policy from time to time to reflect changes to the service or legal requirements. When we make material changes, we'll update the 'last updated' date at the top of this page and, where appropriate, notify you.",
    ],
  },
  {
    heading: "Contact us",
    body: [
      "Questions or requests about this policy or your data? Email ssearch456@gmail.com and we'll be happy to help.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="August 2026"
      sections={sections}
    />
  );
}