import {
  FileImage,
  FileText,
  Layers,
  ScanText,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { DocumentsGrid } from "@/components/documents-grid";
import { DashboardClient } from "@/components/dashboard-client";
import { GoogleAd } from "@/components/ads/google-ad";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const user = await getUser();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Your documents
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every source you&apos;ve uploaded — typed PDFs, photos and
            handwritten pages — ready to turn into study tools.
          </p>
        </div>
        <DashboardClient />
      </div>

      <UploadHint />
      <DocumentsGrid userId={user.id} />

      <GoogleAd slot="studyai-documents" format="auto" className="min-h-20" />
    </div>
  );
}

function UploadHint() {
  return (
    <div className="grid gap-4 rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-400 text-white shadow-sm">
          <UploadCloud className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Upload your sources
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Add study material — typed PDFs, photos, scans or handwritten
            pages — and StudyAI turns it into notes, summaries, flashcards,
            quizzes, mind maps and a personal AI tutor.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-muted-foreground">
              <FileText className="h-3 w-3" /> PDF
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-muted-foreground">
              <FileImage className="h-3 w-3" /> Photos
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-muted-foreground">
              <ScanText className="h-3 w-3" /> Scanned &amp; handwritten
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-muted-foreground">
              up to 100 MB
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-start gap-2 pl-15 sm:items-end sm:pl-0">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Upload → Process → Study
        </p>
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Layers className="h-3.5 w-3.5 text-primary" />
          OCR runs automatically on handwriting
        </p>
      </div>
    </div>
  );
}