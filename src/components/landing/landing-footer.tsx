import Link from "next/link";
import { GraduationCap } from "lucide-react";

const PRODUCT_LINKS = [
  { href: "/notes", label: "AI Notes" },
  { href: "/pdf-summarizer", label: "PDF Summarizer" },
  { href: "/ocr", label: "Handwriting OCR" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/mindmap", label: "Mind Maps" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Study Tips Blog" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/disclaimer", label: "Disclaimer" },
];

function Column({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-ink-500 transition hover:text-ink-900"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Footer. Every link points at a real, existing route in this app. */
export function LandingFooter() {
  return (
    <footer className="border-t border-cream-200 bg-cream-100/70 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white">
                <GraduationCap className="h-4 w-4" />
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-ink-900">
                Study<span className="text-emerald-600">AI</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-600">
              Turn any PDF — typed or handwritten — into summaries, flashcards,
              quizzes, mind maps and an AI tutor. Free and ad-supported.
            </p>
          </div>
          <Column title="Product" links={PRODUCT_LINKS} />
          <Column title="Company" links={COMPANY_LINKS} />
          <Column title="Legal" links={LEGAL_LINKS} />
        </div>
        <div className="mt-10 border-t border-cream-200 pt-6 text-center text-xs text-ink-500">
          © {new Date().getFullYear()} StudyAI. Study smarter with AI · Free and
          ad-supported · Powered by Next.js, Supabase & NVIDIA
        </div>
      </div>
    </footer>
  );
}