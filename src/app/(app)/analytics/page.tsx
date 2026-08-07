import { getUser, createClient } from "@/lib/supabase/server";
import { getDashboardStats, computeStreak } from "@/lib/analytics";
import { formatTotalTime } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleAd } from "@/components/ads/google-ad";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const stats = await getDashboardStats(supabase, user.id);

  const { data: activities } = await supabase
    .from("study_activities")
    .select("id, type, title, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const byType = (stats.totalActivities || 0) > 0
    ? activityBreakdown(activities ?? [])
    : [];

  const totalTime = formatTotalTime(stats.totalStudySeconds);

  const typeLabels: Record<string, string> = {
    summary: "Summaries",
    flashcards: "Flashcards",
    quiz: "Quizzes",
    chat: "Chat sessions",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your study habits, at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Total sessions" value={String(stats.totalActivities)} />
        <MiniStat label="Documents" value={String(stats.documentsCount)} />
        <MiniStat
          label="Average quiz score"
          value={stats.quizAverageScore == null ? "—" : `${stats.quizAverageScore}%`}
        />
        <MiniStat label="Current streak" value={`${stats.streak} days`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="AI chats" value={String(stats.chatSessions)} />
        <MiniStat label="Notes created" value={String(stats.notesCreated)} />
        <MiniStat label="Flashcards studied" value={String(stats.flashcardsStudied)} />
        <MiniStat label="Total study time" value={totalTime} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activity by type</CardTitle>
            <CardDescription>What you use StudyAI for most</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {byType.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No activity yet — generate your first summary or flashcards.
              </p>
            ) : (
              byType.map((item) => (
                <div key={item.type} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{typeLabels[item.type] ?? item.type}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500"
                      style={{ width: `${(item.count / byType[0].count) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Your latest study sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {activities?.length ? (
              <ul className="space-y-3">
                {activities.slice(0, 10).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{a.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <GoogleAd slot="studyai-analytics" format="auto" className="min-h-24" />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-heading text-2xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function activityBreakdown(
  rows: { type: string }[],
): { type: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}
