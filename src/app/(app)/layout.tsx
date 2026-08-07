import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { StudyTimer } from "@/components/study-timer";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s · StudyAI",
  },
};

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <AppShell
      userEmail={user.email ?? "Student"}
      userInitials={
        user.email ? user.email.slice(0, 2).toUpperCase() : "SA"
      }
    >
      <StudyTimer />
      {children}
    </AppShell>
  );
}
