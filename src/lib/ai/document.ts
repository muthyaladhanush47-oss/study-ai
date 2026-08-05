import type { SupabaseClient } from "@supabase/supabase-js";
import { truncate } from "@/lib/pdf";

export type OwnedDocument = {
  id: string;
  title: string;
  content: string;
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
    .select("id, title")
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
  };
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
