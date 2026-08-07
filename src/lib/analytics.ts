import type { SupabaseClient } from "@supabase/supabase-js";

export type DayCount = {
  date: string;
  label: string;
  count: number;
};

export type DashboardStats = {
  documentsCount: number;
  totalActivities: number;
  quizQuestionsAnswered: number;
  chatSessions: number;
  notesCreated: number;
  quizAverageScore: number | null;
  streak: number;
  weekly: DayCount[];
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function computeStreak(dates: string[]): number {
  const unique = new Set(dates.map((d) => d.slice(0, 10)));
  if (unique.size === 0) return 0;

  let cursor = startOfDay(new Date());
  // A streak counts if there was activity today OR yesterday.
  if (!unique.has(toIsoDate(cursor))) {
    cursor = new Date(cursor.getTime() - 86_400_000);
    if (!unique.has(toIsoDate(cursor))) return 0;
  }

  let streak = 0;
  while (unique.has(toIsoDate(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }
  return streak;
}

export async function getDashboardStats(
  supabase: SupabaseClient,
  userId: string,
): Promise<DashboardStats> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 6);

  const [{ count: documentsCount }, { data: activities }] = await Promise.all([
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("study_activities")
      .select("id, type, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const rows = (activities ?? []) as {
    id: string;
    type: string;
    metadata?: Record<string, unknown> | null;
    created_at: string;
  }[];

  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekly: DayCount[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(since.getTime() + i * 86_400_000);
    const iso = toIsoDate(day);
    const count = rows.filter((r) => r.created_at?.slice(0, 10) === iso).length;
    weekly.push({ date: iso, label: labels[day.getDay()], count });
  }

  const quizQuestionsAnswered = rows
    .filter((r) => r.type === "quiz")
    .reduce(
      (sum, r) =>
        sum + Number((r.metadata as { questionCount?: number })?.questionCount ?? 0),
      0,
    );

  const quizScores = rows
    .filter((r) => r.type === "quiz")
    .map((r) =>
      Number((r.metadata as { scorePercent?: number })?.scorePercent ?? NaN),
    )
    .filter((n) => Number.isFinite(n));

  const quizAverageScore =
    quizScores.length > 0
      ? Math.round(
          quizScores.reduce((a, b) => a + b, 0) / quizScores.length,
        )
      : null;

  const chatSessions = rows.filter((r) => r.type === "chat").length;
  const notesCreated = rows.filter((r) => r.type === "summary").length;

  return {
    documentsCount: documentsCount ?? 0,
    totalActivities: rows.length,
    quizQuestionsAnswered,
    chatSessions,
    notesCreated,
    quizAverageScore,
    streak: computeStreak(rows.map((r) => r.created_at)),
    weekly,
  };
}
