import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Activity, FileText, GraduationCap, Mail, UserCircle } from "lucide-react";
import { getUser, createClient } from "@/lib/supabase/server";
import { getInitials, formatDate, formatBytes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile-form";

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
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-fuchsia-600 text-2xl font-bold text-white">
            {getInitials(user.user_metadata?.full_name as string, user.email)}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {(user.user_metadata?.full_name as string) || "Student"}
            </h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground sm:justify-start">
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                {user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <UserCircle className="h-4 w-4" />
                Member since {user.created_at ? formatDate(user.created_at) : "—"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat value={String((documents ?? []).length)} label="Documents" />
        <Stat value={formatBytes(totalBytes)} label="Notes stored" />
        <Stat value={String((activities ?? []).length)} label="Recent activities" />
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            AI tutor settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(activities ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No activity yet. Upload a document and start generating study tools.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {(activities ?? []).map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        {activityLabels[a.type] ?? a.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{a.title}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="font-heading text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
