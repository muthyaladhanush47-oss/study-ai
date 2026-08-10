import Link from "next/link";
import { ArrowRight, FileText, ScanText, Workflow } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { getDocuments } from "@/components/documents-grid";
import { DashboardClient } from "@/components/dashboard-client";
import { GoogleAd } from "@/components/ads/google-ad";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { DocumentRecord } from "@/types";

export const dynamic = "force-dynamic";

export default async function MindmapsLauncherPage() {
  const user = await getUser();
  if (!user) return null;

  const documents = await getDocuments(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Mind maps
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a document and StudyAI turns it into an interactive mind map —
            central topic, branches, and connections.
          </p>
        </div>
        <DashboardClient />
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Workflow className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No documents yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Upload a PDF or a photo of your notes above, then open it here to
            generate a mind map.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {documents.map((doc) => (
            <MindMapDocumentRow key={doc.id} document={doc} />
          ))}
        </ul>
      )}

      <GoogleAd slot="studyai-mindmap" format="auto" className="min-h-20" />
    </div>
  );
}

function MindMapDocumentRow({ document }: { document: DocumentRecord }) {
  const needsOcr =
    document.text_source === "scanned" && !document.is_ocr_ready;
  const processing =
    needsOcr &&
    (document.processing_status === "pending" ||
      document.processing_status === "processing");

  return (
    <li>
      <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {document.title}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDate(document.created_at)}
            {document.page_count != null && document.page_count > 0
              ? ` · ${document.page_count} pages`
              : ""}
          </p>
          {needsOcr && (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
              <ScanText className="h-3.5 w-3.5 shrink-0" />
              {processing
                ? "Transcribing handwriting — mind map unlocks when ready."
                : "Handwriting detected — transcribe first to unlock the mind map."}
            </p>
          )}
        </div>
        {needsOcr ? (
          <span
            aria-disabled
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground"
          >
            {processing ? "Transcribing…" : "OCR needed"}
          </span>
        ) : (
          <Link
            href={`/mindmap/${document.id}`}
            className="shrink-0"
            aria-label={`Open mind map for ${document.title}`}
          >
            <Button size="sm">
              Open mind map
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </li>
  );
}
