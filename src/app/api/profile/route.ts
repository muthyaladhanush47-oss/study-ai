import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { LearningLevel } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const LEVELS: LearningLevel[] = ["beginner", "intermediate", "advanced"];

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("profiles")
    .select("user_id, display_name, learning_level, goal, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ profile: data ?? null });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    display_name?: string | null;
    learning_level?: string;
    goal?: string | null;
  };

  const level = LEVELS.includes(body.learning_level as LearningLevel)
    ? (body.learning_level as LearningLevel)
    : "beginner";

  const profile = {
    user_id: user.id,
    display_name: body.display_name?.trim().slice(0, 60) || null,
    learning_level: level,
    goal: body.goal?.trim().slice(0, 300) || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: `Failed to save profile: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ profile: data });
}
