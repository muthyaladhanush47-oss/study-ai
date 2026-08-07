import type { SupabaseClient } from "@supabase/supabase-js";
import { truncate } from "@/lib/pdf";

export type OwnedDocument = {
  id: string;
  title: string;
  content: string;
  textSource?: string | null;
  isOcrReady?: boolean | null;
};

export type Profile = {
  display_name?: string | null;
  learning_level?: string | null;
  goal?: string | null;
};

/**
 * Fetches a document owned by the user together with its extracted text.
 * Returns null when the document does not exist or belongs to someone else.
 */
export async function getOwnedDocument(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
  maxChars = 80_000,
): Promise<OwnedDocument | null> {
  const { data: doc } = await supabase
    .from("documents")
    .select("id, title, text_source, is_ocr_ready")
    .eq("id", documentId)
    .eq("user_id", userId)
    .single();

  if (!doc) return null;

  const { data: content } = await supabase
    .from("document_content")
    .select("content")
    .eq("document_id", documentId)
    .single();

  return {
    id: doc.id,
    title: doc.title,
    content: truncate(content?.content ?? "", maxChars),
    textSource: doc.text_source,
    isOcrReady: doc.is_ocr_ready,
  };
}

export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("display_name, learning_level, goal")
    .eq("user_id", userId)
    .maybeSingle();

  return (data as Profile | null) ?? null;
}

/**
 * Turns a user's study profile into tutor instructions.
 */
export function buildStudyContext(profile: Profile | null): string {
  const lines: string[] = [];
  if (profile?.display_name) lines.push(`Call the student "${profile.display_name}".`);
  const level = profile?.learning_level ?? "beginner";
  lines.push(`Explain at a ${level} level and gradually build up.`);
  if (profile?.goal) lines.push(`The student's goal: ${profile.goal}.`);
  return lines.join(" ");
}

export async function logActivity(
  supabase: SupabaseClient,
  opts: {
    userId: string;
    documentId?: string | null;
    type: "summary" | "flashcards" | "quiz" | "chat";
    title: string;
    metadata?: Record<string, unknown>;
  },
) {
  return supabase.from("study_activities").insert({
    user_id: opts.userId,
    document_id: opts.documentId ?? null,
    type: opts.type,
    title: opts.title,
    metadata: opts.metadata ?? {},
  });
}
