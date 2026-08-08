"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, Menu, Sparkles, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/signout-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navItems, toolNav, Sidebar } from "@/components/shell/sidebar";

export function AppShell({
  userEmail,
  userInitials,
  children,
}: {
  userEmail: string;
  userInitials: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const activeLabel =
    navItems.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.label ??
    toolNav.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.label ??
    (pathname.startsWith("/profile") || pathname.startsWith("/analytics")
      ? pathname.startsWith("/profile")
        ? "Profile"
        : "Analytics"
      : "Study");

  return (
    <div className="flex min-h-screen bg-cream-50 dark:bg-background">
      <Sidebar className="hidden lg:flex" />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-cream-200/80 bg-cream-50/85 px-4 backdrop-blur-md sm:px-6 lg:px-10 dark:bg-background/85">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    aria-label="Open menu"
                  />
                }
              >
                <Menu className="h-5 w-5 text-ink-700 dark:text-ink-300" />
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <MobileMenu />
              </SheetContent>
            </Sheet>
            <h1 className="font-display text-lg font-semibold tracking-tight text-ink-900 sm:text-xl">
              {activeLabel}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className="gap-2 rounded-full px-1.5 py-1.5"
                    aria-label="Account menu"
                  />
                }
              >
                <Avatar size="sm">
                  <AvatarFallback className="bg-emerald-600/15 font-semibold text-emerald-700 dark:text-emerald-300">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="px-2 py-1.5">
                  <p className="truncate text-sm font-medium text-foreground">
                    {userEmail}
                  </p>
                  <p className="truncate text-xs font-normal text-muted-foreground">
                    Study smarter with StudyAI
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={
                    <Link href="/profile" className="flex items-center gap-2">
                      <UserRound />
                      Profile & learning level
                    </Link>
                  }
                />
                <DropdownMenuSeparator />
                <div className="p-1">
                  <SignOutButton />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function MobileMenu() {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    cn(
      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      pathname === href || pathname.startsWith(`${href}/`)
        ? "bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
        : "text-ink-600 hover:bg-cream-200/60 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-200/5 dark:hover:text-ink-200",
    );

  return (
    <nav className="nice-scroll flex h-full flex-col gap-1 overflow-y-auto p-4">
      <Link href="/dashboard" className="flex items-center gap-2 px-1 pb-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-sm">
          <BookOpenCheck className="h-5 w-5" />
        </span>
        <span className="font-display text-lg font-bold tracking-tight text-ink-900">
          Study<span className="text-emerald-600">AI</span>
        </span>
      </Link>

      <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
        Workspace
      </p>
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} className={linkClass(item.href)}>
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}

      <div className="pt-4">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
          AI Study tools
        </p>
        {toolNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={linkClass(item.href) + " mt-0.5"}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-cream-200 bg-cream-100/70 p-3 dark:bg-ink-200/5">
        <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
        <p className="text-xs text-ink-600 dark:text-ink-400">
          StudyAI is free and supported by ads — no subscriptions.
        </p>
      </div>
    </nav>
  );
}