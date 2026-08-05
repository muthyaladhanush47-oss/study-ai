"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, LayoutDashboard, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/signout-button";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: User },
];

export function Navbar({
  userEmail,
  userInitials,
}: {
  userEmail: string;
  userInitials: string;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-violet-600 text-white">
            <BookOpenCheck className="h-4 w-4" />
          </span>
          <span className="hidden text-lg font-bold tracking-tight sm:block">
            Study<span className="text-brand-600 dark:text-brand-400">AI</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                )}
              >
                <link.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden items-center gap-2 rounded-lg border border-zinc-200 py-1 pl-1 pr-3 dark:border-zinc-800 md:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-600 to-violet-600 text-xs font-bold text-white">
              {userInitials}
            </span>
            <span className="max-w-[10rem] truncate text-xs text-zinc-600 dark:text-zinc-300">
              {userEmail}
            </span>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
