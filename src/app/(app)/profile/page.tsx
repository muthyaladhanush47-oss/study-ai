import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Activity, FileText, Mail, UserCircle } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/signout-button";
import { getInitials, formatDate, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Profile",
};

export const dynamic = "force-dynamic";

const activityLabels: Record<string, string> = {
  summary: "Generated a chapter summary",
  flashcards: "Generated flashcards",
  quiz: "Generated a quiz",
  chat: "Chatted about a document",
};

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [{ data: documents }, { data: activities }] = await Promise.all([
    supabase
      .from("documents")
      .select("file_size")
      .eq("user_id", user.id),
    supabase
      .from("study_activities")
      .select("id, type, title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const totalBytes = (documents ?? []).reduce(
    (sum, d) => sum + (d.file_size ?? 0),
    0,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-5 p-8 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 text-2xl font-bold text-white">
            {getInitials(user.user_metadata?.full_name as string, user.email)}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold tracking-tight">
              {(user.user_metadata?.full_name as string) || "Student"}
            </h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400 sm:justify-start">
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                {user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <UserCircle className="h-4 w-4" />
                Member since {user.created_at ? formatDate(user.created_at) : "—"}
              </span>
            </div>
            <div className="mt-4 flex justify-center gap-2 sm:justify-start">
              <SignOutButton />
              <Button variant="outline" disabled>
                Edit profile coming soon
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-2xl font-bold">{(documents ?? []).length}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Documents
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-2xl font-bold">{formatBytes(totalBytes)}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Notes stored
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-2xl font-bold">
              {(activities ?? []).length}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Recent activities
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(activities ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No activity yet. Upload a document and start generating study tools.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {(activities ?? []).map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        {activityLabels[a.type] ?? a.title}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {a.title}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {formatDate(a.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
