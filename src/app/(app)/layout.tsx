import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
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
    <div className="flex min-h-screen flex-col">
      <Navbar
        userEmail={user.email ?? "Student"}
        userInitials={
          user.email ? user.email.slice(0, 2).toUpperCase() : "SA"
        }
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
