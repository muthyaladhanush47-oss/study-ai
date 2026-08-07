"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, UserRound } from "lucide-react";
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
import { navItems, Sidebar } from "@/components/shell/sidebar";

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
    )?.label ?? "Study";

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar className="hidden lg:flex" />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6 lg:px-8">
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
                <Menu />
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <MobileMenu />
              </SheetContent>
            </Sheet>
            <h1 className="font-heading text-base font-semibold sm:text-lg">
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
                  <AvatarFallback className="bg-primary/10 text-primary">
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
                    Signed in as student
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={
                    <Link
                      href="/profile"
                      className="flex items-center gap-2"
                    >
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

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function MobileMenu() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col p-3">
      {navItems.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
    </nav>
  );
}
