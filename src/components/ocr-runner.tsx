"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ScanText } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !documentId || running) return;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, documentId]);

  async function run() {
    if (!documentId) return;
    setRunning(true);
    setPhase("reading");
    setPage(null);
    setTotal(null);
    setMessage(null);
    setError(null);

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
            setMessage(String(ev.data.message ?? ""));
          } else if (ev.event === "progress") {
            setPhase("transcribing");
            setPage(Number(ev.data.page));
            setTotal(Number(ev.data.total));
            setMessage(String(ev.data.message ?? ""));
          } else if (ev.event === "error") {
            setPhase("error");
            setError(String(ev.data.message ?? "OCR failed."));
            finished = true;
            break;
          } else if (ev.event === "done") {
            setPhase("done");
            setMessage(null);
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
      }
    } catch (err) {
      setPhase("error");
      setError(
        err instanceof Error
          ? err.message
          : "OCR failed. Please try again.",
      );
    } finally {
      setRunning(false);
    }
  }

  function close() {
    onOpenChange(false);
    router.refresh();
  }

  const progressPercent =
    page != null && total != null && total > 0
      ? Math.round((page / total) * 100)
      : null;

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
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                {message ??
                  (phase === "transcribing"
                    ? "Transcribing…"
                    : "Reading your handwritten notes…")}
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all duration-500",
                    progressPercent == null ? "w-1/3 animate-pulse" : "",
                  )}
                  style={{ width: progressPercent == null ? "33%" : `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {progressPercent != null
                  ? `${progressPercent}% complete`
                  : "This can take a minute or two for long PDFs. You can keep the tab open — we&apos;ll tell you when it&apos;s ready."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {phase === "done" ? (
            <Button onClick={close}>Done</Button>
          ) : phase === "error" ? (
            <div className="flex w-full gap-2">
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
