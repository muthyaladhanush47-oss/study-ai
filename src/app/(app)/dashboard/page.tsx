import {
  Clock,
  FileText,
  Flame,
  Layers,
  ListChecks,
  NotebookPen,
} from "lucide-react";
import { getUser, createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/analytics";
import { formatDate, formatTotalTime } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardClient } from "@/components/dashboard-client";
import { DocumentsGrid } from "@/components/documents-grid";
import { WeeklyChart } from "@/components/weekly-chart";
import { GoogleAd } from "@/components/ads/google-ad";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const stats = await getDashboardStats(supabase, user.id);

  const firstName =
    (user.user_metadata?.full_name as string)?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "Student";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back,{" "}
            <span className="text-gradient capitalize">{firstName}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Turn any PDF — typed or handwritten — into study tools.
          </p>
        </div>
        <DashboardClient />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="PDFs uploaded"
          value={String(stats.documentsCount)}
          accent="from-primary to-blue-500"
        />
        <StatCard
          icon={<NotebookPen className="h-5 w-5" />}
          label="Notes created"
          value={String(stats.notesCreated)}
          accent="from-violet-500 to-purple-600"
        />
        <StatCard
          icon={<Layers className="h-5 w-5" />}
          label="Flashcards studied"
          value={String(stats.flashcardsStudied)}
          accent="from-fuchsia-500 to-purple-500"
        />
        <StatCard
          icon={<ListChecks className="h-5 w-5" />}
          label="Quizzes completed"
          value={String(stats.quizzesCompleted)}
          accent="from-emerald-500 to-teal-500"
        />
        <StatCard
          icon={<Flame className="h-5 w-5" />}
          label="Study streak"
          value={`${stats.streak}d`}
          accent="from-amber-500 to-orange-500"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Total study time"
          value={formatTotalTime(stats.totalStudySeconds)}
          accent="from-sky-500 to-cyan-500"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly activity</CardTitle>
            <CardDescription>Study sessions over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyChart data={stats.weekly} className="h-44" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Member since</CardTitle>
            <CardDescription>You&apos;ve been learning with us</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-2xl font-bold tracking-tight">
              {user.created_at ? formatDate(user.created_at) : "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              Keep your streak alive — study for 10 minutes a day.
            </p>
          </CardContent>
        </Card>
      </div>

      <GoogleAd slot="studyai-dashboard" format="auto" className="min-h-24" />

      <div className="space-y-4">
        <h2 className="font-heading text-lg font-semibold">Your documents</h2>
        <DocumentsGrid userId={user.id} />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-sm`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl font-bold tracking-tight">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
