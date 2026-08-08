import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, Geist, Inter, Kalam, Patrick_Hand } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { AdsenseLoader } from "@/components/ads/adsense-loader";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const patrickHand = Patrick_Hand({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-patrick-hand",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

const kalam = Kalam({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-kalam",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://study-ai-two-sable.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "StudyAI — AI Study Assistant",
    template: "%s · StudyAI",
  },
  description:
    "Upload any PDF — typed or handwritten — and let AI read it for you. Get chapter summaries, flashcards, quizzes, mind maps, and a smart study tutor that answers from your own notes.",
  keywords: [
    "AI study assistant",
    "handwritten notes OCR",
    "PDF summarizer",
    "flashcards generator",
    "quiz generator",
    "study app",
    "mind map generator",
  ],
  metadataBase: new URL(appUrl),
  openGraph: {
    title: "StudyAI — AI Study Assistant",
    description:
      "Turn any PDF — including handwritten notes — into summaries, flashcards, quizzes, mind maps and an AI tutor that knows your material.",
    type: "website",
    url: appUrl,
    siteName: "StudyAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyAI — AI Study Assistant",
    description:
      "Upload any PDF — typed or handwritten — and study with AI. Summaries, flashcards, quizzes, mind maps.",
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#12101c" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const adClient = process.env.NEXT_PUBLIC_AD_CLIENT;

  return (
    <html lang="en" suppressHydrationWarning className={cn(geist.variable, fraunces.variable, inter.variable, patrickHand.variable, caveat.variable, kalam.variable)}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <AdsenseLoader adClient={adClient} />
        {adClient && (
          <Script
            id="adsense-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.adsbygoogle = window.adsbygoogle || [];`,
            }}
          />
        )}
      </body>
    </html>
  );
}
