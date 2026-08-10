import {
  Brain,
  Clock,
  FileText,
  Flame,
  Layers,
  ListChecks,
  MessageSquareText,
  NotebookPen,
  Sparkles,
  Workflow,
} from "lucide-react";
import { getUser, createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/analytics";
import { formatDate, formatTotalTime } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            {greeting},{" "}
            <span className="text-gradient capitalize">{firstName}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.documentsCount > 0
              ? "Continue your learning — pick up where you left off."
              : "Upload your first source and let StudyAI turn it into study tools."}
          </p>
        </div>
        <DashboardClient />
      </div>

      {/* Quick tools */}
      <section>
        <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-ink-900">
          Continue your learning
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <ToolTile
            icon={Brain}
            label="Flashcards"
            sub="Active recall decks"
            href="/documents"
            accent="bg-gradient-to-br from-emerald-600 to-emerald-400"
          />
          <ToolTile
            icon={NotebookPen}
            label="AI Notes"
            sub="Chapter study notes"
            href="/documents"
            accent="bg-gradient-to-br from-teal-600 to-emerald-400"
          />
          <ToolTile
            icon={ListChecks}
            label="Quizzes"
            sub="Practice questions"
            href="/documents"
            accent="bg-gradient-to-br from-ink-700 to-ink-500"
          />
          <ToolTile
            icon={Workflow}
            label="Mind maps"
            sub="Connect the ideas"
            href="/mindmaps"
            accent="bg-gradient-to-br from-amber-500 to-amber-300"
          />
          <ToolTile
            icon={MessageSquareText}
            label="AI tutor"
            sub="Ask your material"
            href="/documents"
            accent="bg-gradient-to-br from-orange-500 to-amber-400"
          />
        </div>
      </section>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Documents"
          value={String(stats.documentsCount)}
          accent="from-emerald-600 to-emerald-400"
        />
        <StatCard
          icon={<Flame className="h-5 w-5" />}
          label="Study streak"
          value={`${stats.streak}d`}
          accent="from-orange-500 to-amber-400"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Study time"
          value={formatTotalTime(stats.totalStudySeconds)}
          accent="from-teal-600 to-emerald-400"
        />
        <StatCard
          icon={<Layers className="h-5 w-5" />}
          label="Tools used"
          value={String(stats.totalActivities ?? 0)}
          accent="from-ink-700 to-ink-500"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>This week</CardTitle>
            <CardDescription>
              Study sessions over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyChart data={stats.weekly} className="h-44" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Member since</CardTitle>
            <CardDescription>
              You&apos;ve been learning with us
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-2xl font-bold tracking-tight">
              {user.created_at ? formatDate(user.created_at) : "—"}
            </p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Keep your streak alive — study for 10 minutes a day.
            </p>
          </CardContent>
        </Card>
      </div>

      <GoogleAd slot="studyai-dashboard" format="auto" className="min-h-24" />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
            Your documents
          </h2>
          <a
            href="/documents"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            View all
          </a>
        </div>
        <DocumentsGrid userId={user.id} />
      </section>
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

function ToolTile({
  icon: Icon,
  label,
  sub,
  href,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  sub: string;
  href: string;
  accent: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent} text-white shadow-sm`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">
          {label}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {sub}
        </span>
      </span>
    </a>
  );
}