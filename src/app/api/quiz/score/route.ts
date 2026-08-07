import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    documentId?: string;
    score?: number;
    total?: number;
  };
  const { documentId, score, total } = body;

  if (!documentId || typeof score !== "number" || typeof total !== "number") {
    return NextResponse.json(
      { error: "documentId, score and total are required" },
      { status: 400 },
    );
  }

  const { data: activity } = await supabase
    .from("study_activities")
    .select("id, metadata")
    .eq("user_id", user.id)
    .eq("document_id", documentId)
    .eq("type", "quiz")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!activity) {
    return NextResponse.json({ error: "No quiz activity found" }, { status: 404 });
  }

  const existing = (activity.metadata ?? {}) as Record<string, unknown>;
  const scorePercent =
    total > 0 ? Math.round((Math.max(0, Math.min(score, total)) / total) * 100) : 0;

  const { error } = await supabase
    .from("study_activities")
    .update({
      metadata: { ...existing, score, total, scorePercent },
    })
    .eq("id", activity.id);

  if (error) {
    return NextResponse.json(
      { error: `Failed to save quiz score: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, scorePercent });
}
