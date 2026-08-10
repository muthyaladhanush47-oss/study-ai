import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export type NavLink = { href: string; label: string };

const productLinks = [
  { href: "/notes", label: "AI Notes" },
  { href: "/pdf-summarizer", label: "PDF Summarizer" },
  { href: "/ocr", label: "Handwriting OCR" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/quiz", label: "Practice Quiz" },
  { href: "/mindmap", label: "Mind Maps" },
  { href: "/blog", label: "Study Tips Blog" },
];

const companyLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export function MarketingShell({
  nav,
  children,
}: {
  nav?: NavLink[];
  children: React.ReactNode;
}) {
  const navLinks = nav ?? [
    { href: "/", label: "Home" },
    { href: "/blog", label: "Blog" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-400 text-white">
              <BookOpenCheck className="h-4 w-4" />
            </span>
            <span className="font-heading text-lg font-bold tracking-tight">
              Study<span className="text-gradient">AI</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
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

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-600 to-emerald-400 text-white">
                  <BookOpenCheck className="h-3 w-3" />
                </span>
                <span className="font-heading text-sm font-semibold">
                  Study<span className="text-gradient">AI</span>
                </span>
              </div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Turn any PDF — typed or handwritten — into summaries, flashcards,
                quizzes, mind maps and an AI tutor. Free and ad-supported.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Product</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Company</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Legal</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} StudyAI. Study smarter with AI · Free and
            ad-supported · Powered by Next.js, Supabase & NVIDIA
          </div>
        </div>
      </footer>
    </div>
  );
}
