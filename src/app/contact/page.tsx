import type { Metadata } from "next";
import { Mail, MessageSquareText, Sparkles } from "lucide-react";
import { MarketingShell } from "@/components/seo/marketing-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { ContactForm } from "@/components/seo/contact-form";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://study-ai-two-sable.vercel.app";

export const metadata: Metadata = {
  title: "Contact — StudyAI",
  description:
    "Get in touch with the StudyAI team. Send feedback, report a bug, ask a question, or suggest a feature — we usually reply within a couple of days.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact — StudyAI", url: `${baseUrl}/contact` },
};

const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact StudyAI",
  url: `${baseUrl}/contact`,
};

export default function ContactPage() {
  return (
    <MarketingShell
      nav={[
        { href: "/", label: "Home" },
        { href: "/about", label: "About" },
        { href: "/blog", label: "Blog" },
      ]}
    >
      <JsonLd data={contactSchema} />
      <section className="relative overflow-hidden border-b border-border bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <MessageSquareText className="h-3.5 w-3.5" />
            We read everything
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Get in touch
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Questions, feedback, bugs or feature ideas — send them our way and
            we&apos;ll get back to you as soon as we can.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="grid gap-6">
          <ContactForm />
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
            <Mail className="h-5 w-5 shrink-0 text-primary" />
            <span>
              Prefer email? Write to us directly at{" "}
              <a
                href="mailto:ssearch456@gmail.com"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                ssearch456@gmail.com
              </a>
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
            <span>
              For feature requests, describe the study problem you&apos;re trying to
              solve — we build what students actually need.
            </span>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
