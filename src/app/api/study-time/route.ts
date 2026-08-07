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

  const body = (await request.json()) as { seconds?: number };
  const seconds = Math.max(0, Math.floor(Number(body.seconds) || 0));

  if (seconds < 1) {
    return NextResponse.json({ success: true, recorded: 0 });
  }

  const date = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("study_sessions")
    .select("seconds")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  const totalSeconds = (existing?.seconds ?? 0) + seconds;

  const { error } = await supabase.from("study_sessions").upsert(
    {
      user_id: user.id,
      date,
      seconds: totalSeconds,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,date" },
  );

  if (error) {
    return NextResponse.json(
      { error: `Failed to record study time: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, recorded: seconds });
}
