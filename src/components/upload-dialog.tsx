"use client";

import { useRef, useState } from "react";
import { FileText, ScanText, UploadCloud } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MAX_SIZE = 100 * 1024 * 1024;

export function UploadDialog({
  onUploaded,
}: {
  onUploaded?: (result: { documentId: string; needsOcr: boolean }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFiles(files: FileList | null) {
    setError(null);
    const selected = files?.[0];
    if (!selected) return;
    const ext = selected.name.toLowerCase().split(".").pop() ?? "";
    const isPdf = selected.type === "application/pdf" || ext === "pdf";
    const isImage = ["jpg", "jpeg", "png", "webp"].includes(ext);
    if (!isPdf && !isImage) {
      setError("Please choose a PDF, JPG, PNG or WebP file.");
      return;
    }
    if (selected.size > MAX_SIZE) {
      setError("File must be under 100 MB.");
      return;
    }
    setFile(selected);
    setTitle(selected.name.replace(/\.(pdf|jpe?g|png|webp)$/i, ""));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    if (title.trim()) formData.append("title", title.trim());

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => null);

        console.log("Upload API Error:", body);

        throw new Error(
        body?.error ?? `Upload failed (${res.status})`
       );
      }
      const data = (await res.json()) as {
        document: { id: string };
        needsOcr: boolean;
      };
      setOpen(false);
      setFile(null);
      setTitle("");
      onUploaded?.({
        documentId: data.document.id,
        needsOcr: Boolean(data.needsOcr),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <UploadCloud />
        Upload PDF or photo
      </Button>

      <Dialog open={open} onOpenChange={(next) => !uploading && setOpen(next)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload notes</DialogTitle>
            <DialogDescription>
              Typed PDF or a photo of handwritten notes, a whiteboard or a
              textbook page — StudyAI reads them all. Max 20 MB.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpload} className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                onFiles(e.dataTransfer.files);
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition",
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/60",
              )}
            >
              {file ? (
                <>
                  <FileText className="h-8 w-8 text-primary" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} · click to change
                  </p>
                </>
              ) : (
                <>
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Drop your PDF or photo here or{" "}
                    <span className="text-primary">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, JPG, PNG or WebP up to 20 MB
                  </p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <ScanText className="h-4 w-4 shrink-0 text-primary" />
              Photos of handwritten notes, whiteboards and book pages are
              transcribed automatically after upload.
            </div>

            <Input
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button type="submit" loading={uploading} disabled={!file}>
                {uploading ? "Uploading…" : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
