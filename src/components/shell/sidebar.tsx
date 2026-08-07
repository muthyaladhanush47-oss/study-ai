"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  GraduationCap,
  LayoutDashboard,
  ScanText,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile & Level", icon: UserRound },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar dark:bg-background",
        className,
      )}
    >
      <Link href="/dashboard" className="flex h-16 items-center gap-2.5 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-600 text-primary-foreground shadow-sm">
          <BookOpenCheck className="h-5 w-5" />
        </span>
        <span className="font-heading text-lg font-bold tracking-tight">
          Study
          <span className="text-gradient bg-clip-text text-transparent">
            AI
          </span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-6">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            AI Tools
          </p>
          <div className="space-y-1">
            <a
              href="/#features"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ScanText className="h-4 w-4" />
              Handwriting OCR
            </a>
            <a
              href="/#features"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <GraduationCap className="h-4 w-4" />
              AI Tutor
            </a>
          </div>
        </div>
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Free forever</p>
          <p className="mt-1">
            StudyAI is supported by ads — no subscriptions.
          </p>
        </div>
      </div>
    </aside>
  );
}
