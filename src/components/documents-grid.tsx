import { FileText } from "lucide-react";
import type { DocumentRecord } from "@/types";
import { DocumentCard } from "@/components/document-card";

export async function getDocuments(userId: string) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id, title, file_name, file_path, file_size, page_count, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load documents:", error.message);
    return [] as DocumentRecord[];
  }
  return (data ?? []) as DocumentRecord[];
}

export async function DocumentsGrid({ userId }: { userId: string }) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const documents = await getDocuments(userId);

  const signedUrls = await Promise.all(
    documents.map((doc) =>
      supabase.storage
        .from("documents")
        .createSignedUrl(doc.file_path, 3600)
        .then(({ data, error }) => (error ? null : data.signedUrl)),
    ),
  );

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
          <FileText className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold">No documents yet</h3>
        <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          Upload your first PDF above and let StudyAI turn it into summaries,
          flashcards, quizzes, and a study chatbot.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc, i) => (
        <DocumentCard key={doc.id} document={doc} signedUrl={signedUrls[i]} />
      ))}
    </div>
  );
}
