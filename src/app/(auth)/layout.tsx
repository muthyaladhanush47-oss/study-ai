import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-screen flex-col bg-grid">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-fuchsia-600 text-white">
            <BookOpenCheck className="h-4 w-4" />
          </span>
          <span className="font-heading text-lg font-bold tracking-tight">
            Study
            <span className="text-gradient">AI</span>
          </span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        {children}
      </main>
    </div>
  );
}
