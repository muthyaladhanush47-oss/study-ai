import { FileText, ScanText } from "lucide-react";
import type { DocumentRecord } from "@/types";
import { DocumentCard } from "@/components/document-card";

export async function getDocuments(userId: string) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, title, file_name, file_path, file_size, page_count, created_at, text_source, is_ocr_ready",
    )
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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <FileText className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold">No documents yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Upload your first PDF above — typed or handwritten — and let StudyAI
          turn it into summaries, flashcards, quizzes, mind maps, and a smart
          tutor.
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

export function OcrHint() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <ScanText className="h-4 w-4 shrink-0 text-primary" />
      Handwritten PDFs are transcribed automatically — look for the amber
      &ldquo;OCR needed&rdquo; badge.
    </div>
  );
}
