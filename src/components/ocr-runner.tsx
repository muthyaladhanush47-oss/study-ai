"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ScanText } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function OcrRunner({
  open,
  onOpenChange,
  documentId,
  title,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  documentId: string | null;
  title?: string;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !documentId || running) return;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, documentId]);

  async function run() {
    if (!documentId) return;
    setRunning(true);
    setDone(false);
    setError(null);
    setProgress(null);

    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "OCR failed. Please try again.");
      }

      setDone(true);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR failed.");
    } finally {
      setRunning(false);
    }
  }

  function close() {
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!running) {
          onOpenChange(next);
          if (!next) router.refresh();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanText className="h-4 w-4 text-primary" />
            Transcribing handwritten notes
          </DialogTitle>
          <DialogDescription className="truncate">
            {title ?? "Reading every page with AI vision…"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : done ? (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              Done! Your notes are now searchable. Summaries, flashcards and
              chat are ready to use.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                {progress == null
                  ? "Rendering pages and reading handwriting…"
                  : `Processed ${progress}%`}
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all duration-500",
                    progress == null ? "w-1/3 animate-pulse" : "",
                  )}
                  style={{ width: progress == null ? "33%" : `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This can take a minute or two for long PDFs. You can keep the
                tab open — we&apos;ll tell you when it&apos;s ready.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {done ? (
            <Button onClick={close}>Done</Button>
          ) : (
            <Button
              variant="outline"
              onClick={close}
              disabled={running}
              className="text-muted-foreground"
            >
              Run in background
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
