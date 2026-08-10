"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ScanText, X } from "lucide-react";
import Link from "next/link";
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
import { trackEvent } from "@/lib/analytics-events";

type SseEvent = { event: string; data: Record<string, unknown> };

function parseSseStream(raw: string): SseEvent[] {
  const events: SseEvent[] = [];
  const blocks = raw.split("\n\n");
  for (const block of blocks) {
    let event = "message";
    const dataLines: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trim());
      }
    }
    if (dataLines.length === 0) continue;
    try {
      events.push({ event, data: JSON.parse(dataLines.join("\n")) });
    } catch {
      // ignore malformed frames
    }
  }
  return events;
}

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
  const [phase, setPhase] = useState<"reading" | "transcribing" | "done" | "error">(
    "reading",
  );
  const [page, setPage] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [background, setBackground] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [completedDocId, setCompletedDocId] = useState<string | null>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !documentId || running || completedDocId === documentId) return;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, documentId, running, completedDocId]);

  useEffect(() => {
    if (!running && background) router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, background]);

  async function run() {
    if (!documentId) return;
    setRunning(true);
    setActiveDocId(documentId);
    setPhase("reading");
    setPage(null);
    setTotal(null);
    setMessage(null);
    setWaiting(false);
    setError(null);
    setBackground(false);
    setDismissed(false);
    setCompletedDocId(null);
    trackEvent("ocr_started", { document_id: documentId });

    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (body?.error) {
          throw new Error(String(body.error));
        }
        throw new Error(
          `OCR failed (HTTP ${res.status}). The server returned no error details — pages already transcribed were saved, so try again to resume.`,
        );
      }

      if (!res.body) throw new Error("OCR failed: no response stream.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = parseSseStream(buffer);
        for (const ev of events) {
          if (ev.event === "status") {
            setPhase("reading");
            setWaiting(false);
            setMessage(String(ev.data.message ?? ""));
          } else if (ev.event === "progress") {
            setPhase("transcribing");
            setWaiting(false);
            setPage(Number(ev.data.page));
            setTotal(Number(ev.data.total));
            setMessage(String(ev.data.message ?? ""));
          } else if (ev.event === "waiting") {
            setPhase("transcribing");
            setWaiting(true);
            setPage(Number(ev.data.page));
            setTotal(Number(ev.data.total));
            setMessage(String(ev.data.message ?? ""));
          } else if (ev.event === "error") {
            setPhase("error");
            setWaiting(false);
            setError(String(ev.data.message ?? "OCR failed."));
            setCompletedDocId(documentId);
            finished = true;
            break;
          } else if (ev.event === "done") {
            setPhase("done");
            setWaiting(false);
            setMessage(null);
            setCompletedDocId(documentId);
            finished = true;
            break;
          }
        }
        if (finished) break;
        // Drop consumed frames but keep any trailing partial line.
        const lastBreak = buffer.lastIndexOf("\n\n");
        if (lastBreak >= 0) buffer = buffer.slice(lastBreak + 2);
      }

      // Stream ended without a terminal event (e.g. server timeout).
      if (!finished) {
        setPhase("error");
        setError(
          "OCR timed out before finishing. The pages already transcribed were saved — run OCR again to continue.",
        );
        setCompletedDocId(documentId);
      }
    } catch (err) {
      setPhase("error");
      setError(
        err instanceof Error
          ? err.message
          : "OCR failed. Please try again.",
      );
      setCompletedDocId(documentId);
    } finally {
      setRunning(false);
    }
  }

  function close() {
    setBackground(false);
    setDismissed(false);
    onOpenChange(false);
    router.refresh();
  }

  function runInBackground() {
    setBackground(true);
    setDismissed(false);
    onOpenChange(false);
  }

  function restore() {
    setBackground(false);
    setDismissed(true);
    onOpenChange(true);
  }

  const progressPercent =
    page != null && total != null && total > 0
      ? Math.round((page / total) * 100)
      : null;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) {
            onOpenChange(true);
            return;
          }
          if (running) {
            runInBackground();
          } else {
            close();
          }
        }}
      >
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100vw-2rem)] overflow-y-auto p-4 sm:max-w-md sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6 text-base">
            <ScanText className="h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0">Transcribing handwritten notes</span>
          </DialogTitle>
          <DialogDescription className="break-words">
            {title ?? "Reading every page with AI vision…"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {phase === "error" ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">OCR couldn&apos;t finish</p>
                  <p className="mt-1 text-destructive/90">{error}</p>
                </div>
              </div>
              {page != null && total != null && (
                <p className="text-xs text-muted-foreground">
                  Transcribed {page} of {total} pages before failing. The
                  completed pages are already saved.
                </p>
              )}
            </div>
          ) : phase === "done" ? (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              Done! Your notes are now searchable. Summaries, flashcards and
              chat are ready to use.
            </div>
          ) : (
            <div className="space-y-3">
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm",
                  waiting
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    : "border-border bg-muted/40 text-muted-foreground",
                )}
              >
                <Loader2
                  className={cn(
                    "h-5 w-5 shrink-0 animate-spin",
                    waiting ? "text-amber-500" : "text-primary",
                  )}
                />
                {message ??
                  (phase === "transcribing"
                    ? "Transcribing…"
                    : "Reading your handwritten notes…")}
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500",
                    progressPercent == null ? "w-1/3 animate-pulse" : "",
                  )}
                  style={{ width: progressPercent == null ? "33%" : `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {waiting
                  ? "Waiting for Gemini to cool down. Retrying automatically — no action needed."
                  : progressPercent != null
                    ? `${progressPercent}% complete`
                    : "This can take a minute or two for long PDFs. You can keep the tab open — we'll tell you when it's ready."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {phase === "done" ? (
            <Button onClick={close} className="w-full sm:w-auto">Done</Button>
          ) : phase === "error" ? (
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={close}
                className="flex-1 text-muted-foreground"
              >
                Close
              </Button>
              <Button onClick={run} loading={running} className="flex-1">
                <RefreshCw className="h-4 w-4" />
                Retry OCR
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={runInBackground}
              className="w-full text-muted-foreground sm:w-auto"
            >
              Run in background
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

      {background && !dismissed && (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm flex-col gap-3 rounded-xl border border-border bg-background p-4 shadow-lg sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {phase === "done" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              ) : phase === "error" ? (
                <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
              ) : (
                <Loader2
                  className={cn(
                    "h-5 w-5 shrink-0 animate-spin",
                    waiting ? "text-amber-500" : "text-primary",
                  )}
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {phase === "done"
                    ? "Transcription complete"
                    : phase === "error"
                      ? "Transcription failed"
                      : "Transcribing…"}
                </p>
                {phase !== "done" && phase !== "error" && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {page != null && total != null
                      ? `Page ${page} of ${total} · ${progressPercent}%`
                      : message ?? "Reading your handwritten notes…"}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {phase === "done" && activeDocId ? (
            <Button
              render={<Link href={`/pdf-summarizer?id=${activeDocId}`} />}
              className="w-full"
            >
              View summary
            </Button>
          ) : (
            <Button variant="outline" onClick={restore} className="w-full">
              {phase === "error" ? "View error" : "Open progress"}
            </Button>
          )}
        </div>
      )}
    </>
  );
}
