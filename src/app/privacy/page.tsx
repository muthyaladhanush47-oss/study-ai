import type { Metadata } from "next";
import { LegalPage } from "@/components/seo/legal-page";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://study-ai-two-sable.vercel.app";

export const metadata: Metadata = {
  title: "Privacy Policy — StudyAI",
  description:
    "How StudyAI collects, uses, and protects your data. We keep your documents private, never sell your data, and are transparent about the AI processing involved.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Privacy Policy — StudyAI", url: `${baseUrl}/privacy` },
};

const sections = [
  {
    heading: "The short version",
    body: [
      "Your study documents are private. We don't sell your data. We use your content only to provide the study tools you ask for, and we keep as little information as possible.",
    ],
  },
  {
    heading: "Information we collect",
    body: [
      "Account information: the email address and display name you provide when you sign up, plus authentication data handled securely by our provider.",
      "Documents and study activity: the files you upload, the text we extract from them, and a record of study activities (summaries, flashcards, quizzes, chat sessions) so we can show you your progress and streak.",
      "Usage and analytics: anonymous aggregate statistics (such as page views) to understand how the site is used and to keep it free through advertising.",
    ],
  },
  {
    heading: "How we use your information",
    body: [
      "We process your uploaded documents to generate the study tools you request — notes, summaries, flashcards, quizzes, mind maps, and tutor answers. This processing is performed by third-party AI providers under our instructions.",
      "We use account and activity data to authenticate you, show your dashboard statistics, and keep the service running and secure.",
    ],
  },
  {
    heading: "How we share your information",
    body: [
      "We never sell your personal information. We share data only with (1) service providers who help us operate the site (hosting, storage, authentication, and AI processing), each bound by confidentiality, and (2) advertising partners who may serve ads based on cookies or similar technologies, as described below.",
    ],
  },
  {
    heading: "Cookies and advertising",
    body: [
      "StudyAI uses essential cookies to keep you signed in. If we show advertising through a third-party network (such as Google AdSense), that network may use cookies or similar technologies to serve relevant ads and to measure ad performance. You can manage or block these cookies through your browser settings.",
    ],
  },
  {
    heading: "Data retention",
    body: [
      "Your documents and account data are kept until you delete them. You can delete individual documents from your dashboard at any time, and you may request deletion of your entire account and all associated data by contacting us.",
    ],
  },
  {
    heading: "Children's privacy",
    body: [
      "StudyAI is intended for users who are at least 13 years old. We do not knowingly collect personal information from children under 13.",
    ],
  },
  {
    heading: "Your rights",
    body: [
      "Depending on your location, you may have the right to access, correct, or delete your personal information, and to object to or restrict certain processing. To exercise any of these rights, contact us and we'll respond promptly.",
    ],
  },
  {
    heading: "Changes to this policy",
    body: [
      "We may update this Privacy Policy from time to time. When we make material changes, we'll update the 'last updated' date at the top of this page and, where appropriate, notify you.",
    ],
  },
  {
    heading: "Contact us",
    body: [
      "Questions about this policy or your data? Email ssearch456@gmail.com and we'll be happy to help.",
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
