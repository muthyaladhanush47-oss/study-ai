"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Brain,
  FileText,
  Layers,
  Loader2,
  MessageSquareText,
  ScanText,
  Sparkles,
  Trash2,
  Workflow,
} from "lucide-react";
import { formatBytes, formatDate } from "@/lib/utils";
import type { DocumentRecord } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { OcrRunner } from "@/components/ocr-runner";
import { cn } from "@/lib/utils";

const actions = [
  { href: "/chat", label: "Chat", icon: MessageSquareText },
  { href: "/summaries", label: "Notes", icon: Layers },
  { href: "/flashcards", label: "Cards", icon: Brain },
  { href: "/quiz", label: "Quiz", icon: Sparkles },
];

export function DocumentCard({
  document,
  signedUrl,
}: {
  document: DocumentRecord;
  signedUrl: string | null;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);

  const needsOcr = document.text_source === "scanned" && !document.is_ocr_ready;

  async function handleDelete() {
    if (!confirm(`Delete "${document.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/documents/${document.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.refresh();
    } else {
      setDeleting(false);
      alert("Failed to delete the document.");
    }
  }

  return (
    <Card className="group flex flex-col transition hover:border-primary/40 hover:shadow-md">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1">
            {needsOcr && (
              <Badge variant="outline" className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <ScanText className="h-3 w-3" />
                OCR needed
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              loading={deleting}
              aria-label="Delete document"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 />
            </Button>
          </div>
        </div>

        <h3 className="mt-4 truncate font-semibold" title={document.title}>
          {document.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDate(document.created_at)}
          {" · "}
          {formatBytes(document.file_size)}
          {document.page_count != null && document.page_count > 0
            ? ` · ${document.page_count} pages`
            : ""}
        </p>

        {needsOcr && (
          <button
            type="button"
            onClick={() => setOcrOpen(true)}
            className={cn(
              "mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-500/20 dark:text-amber-300",
            )}
          >
            <Loader2 className="h-3.5 w-3.5" />
            Transcribe handwriting with OCR
          </button>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <a
              key={action.label}
              href={`${action.href}/${document.id}`}
              aria-disabled={needsOcr}
              onClick={(e) => needsOcr && e.preventDefault()}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg border border-border px-2 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
                needsOcr && "pointer-events-none opacity-50",
              )}
            >
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </a>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <a
            href={signedUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "text-xs font-medium text-primary underline-offset-4 hover:underline",
              !signedUrl && "pointer-events-none text-muted-foreground/50",
            )}
          >
            View PDF
          </a>
          <a
            href={`/mindmap/${document.id}`}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-primary"
          >
            <Workflow className="h-3.5 w-3.5" />
            Mind map
          </a>
        </div>
      </CardContent>

      <OcrRunner
        open={ocrOpen}
        onOpenChange={setOcrOpen}
        documentId={document.id}
        title={document.title}
      />
    </Card>
  );
}
