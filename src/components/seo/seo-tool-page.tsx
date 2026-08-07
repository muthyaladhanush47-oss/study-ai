import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  type LucideIcon,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { GoogleAd } from "@/components/ads/google-ad";
import { JsonLd } from "@/components/seo/json-ld";

export type SeoFaq = { q: string; a: string };
export type SeoFeature = { title: string; description: string };
export type SeoStep = { step: string; title: string; description: string };

type SeoToolPageProps = {
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  adSlot: string;
  features: SeoFeature[];
  steps: SeoStep[];
  faqs: SeoFaq[];
  softwareSchema: Record<string, unknown>;
};

export function SeoToolPage({
  eyebrow,
  icon: Icon,
  title,
  subtitle,
  adSlot,
  features,
  steps,
  faqs,
  softwareSchema,
}: SeoToolPageProps) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={softwareSchema} />
      <JsonLd data={faqSchema} />

      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-fuchsia-600 text-white">
              <BookOpenCheck className="h-4 w-4" />
            </span>
            <span className="font-heading text-lg font-bold tracking-tight">
              Study<span className="text-gradient">AI</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
            <a href="#features" className="transition hover:text-foreground">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-foreground">
              How it works
            </a>
            <a href="#faq" className="transition hover:text-foreground">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Get started <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_40%,transparent_75%)]" />
          <div className="absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl dark:bg-primary/10" />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {eyebrow}
              </span>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
                {title}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                {subtitle}
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">
                    Try it free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Log in
                  </Button>
                </Link>
              </div>
              <div className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-3 rounded-2xl border border-border bg-card/60 px-5 py-4 text-sm text-muted-foreground">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                Free to use · No subscription · Ad-supported
              </div>
            </div>
          </div>
        </section>

        <GoogleAd slot={adSlot} format="auto" className="mx-auto max-w-6xl px-4 sm:px-6" />

        {/* Features */}
        <section id="features" className="border-t border-border bg-muted/40 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Why students love it
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything built around your own notes — private, instant, and free.
              </p>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                >
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How it works
              </h2>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.step} className="relative">
                  <div className="text-5xl font-black text-primary/15">
                    {step.step}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-border bg-muted/40 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Frequently asked questions
              </h2>
            </div>
            <div className="mt-12 space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                    {faq.q}
                    <span className="text-muted-foreground transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-fuchsia-600 to-violet-600 px-6 py-16 text-center text-white sm:px-16">
              <div className="absolute inset-0 bg-grid opacity-20" />
              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Start studying smarter today
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
                  Create your free account and turn your notes into study tools in
                  under a minute.
                </p>
                <Link href="/signup" className="mt-8 inline-block">
                  <Button
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90"
                  >
                    Create free account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-fuchsia-600 text-white">
              <BookOpenCheck className="h-3 w-3" />
            </span>
            <span className="font-heading text-sm font-semibold">
              Study<span className="text-gradient">AI</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Study smarter with AI · Free and ad-supported · Powered by Next.js,
            Supabase & OpenRouter
          </p>
        </div>
      </footer>
    </div>
  );
}
