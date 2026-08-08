"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Layers,
  MessageSquareText,
  Sparkles,
  UserRound,
  Workflow,
  NotebookPen,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", icon: FileText },
] as const;

export const toolNav = [
  { href: "/notes", label: "AI Notes", icon: NotebookPen },
  { href: "/pdf-summarizer", label: "Summaries", icon: Layers },
  { href: "/flashcards", label: "Flashcards", icon: Sparkles },
  { href: "/quiz", label: "Quiz", icon: ListChecks },
  { href: "/mindmap", label: "Mind Map", icon: Workflow },
  { href: "/ocr", label: "Handwriting OCR", icon: GraduationCap },
] as const;

function SideNavLink({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  pathname: string;
}) {
  const isActiveLink = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        isActiveLink
          ? "bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "text-ink-600 hover:bg-cream-200/60 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-200/5 dark:hover:text-ink-200",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-cream-200 bg-card/60 backdrop-blur",
        className,
      )}
    >
      <Link
        href="/dashboard"
        className="flex h-16 items-center gap-2.5 border-b border-cream-200/70 px-5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-sm">
          <BookOpenCheck className="h-5 w-5" />
        </span>
        <span className="font-display text-lg font-bold tracking-tight text-ink-900">
          Study<span className="text-emerald-600">AI</span>
        </span>
      </Link>

      <nav className="nice-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
          Workspace
        </p>
        {navItems.map((item) => (
          <SideNavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            pathname={pathname}
          />
        ))}

        <div className="pt-5">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            AI Study tools
          </p>
          <div className="space-y-0.5">
            {toolNav.map((item) => (
              <SideNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                pathname={pathname}
              />
            ))}
          </div>
        </div>

        <div className="pt-5">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            Account
          </p>
          <div className="space-y-0.5">
            <SideNavLink
              href="/profile"
              label="Profile & Level"
              icon={UserRound}
              pathname={pathname}
            />
            <SideNavLink
              href="/analytics"
              label="Analytics"
              icon={BarChart3}
              pathname={pathname}
            />
          </div>
        </div>
      </nav>

      <div className="border-t border-cream-200 p-4">
        <div className="rounded-2xl border border-cream-200 bg-cream-100/70 p-3.5 text-xs text-ink-600 dark:bg-ink-200/5">
          <p className="flex items-center gap-1.5 font-semibold text-ink-900">
            <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
            Free forever
          </p>
          <p className="mt-1 leading-relaxed">
            Upload one PDF and StudyAI turns it into notes, cards, quizzes and
            a mind map — instantly.
          </p>
        </div>
      </div>
    </aside>
  );
}