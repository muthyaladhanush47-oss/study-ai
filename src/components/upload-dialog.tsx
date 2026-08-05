"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_SIZE = 20 * 1024 * 1024;

export function UploadDialog() {
  const router = useRouter();
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
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }
    if (selected.size > MAX_SIZE) {
      setError("File must be under 20 MB.");
      return;
    }
    setFile(selected);
    setTitle(selected.name.replace(/\.pdf$/i, ""));
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
        throw new Error(
          body?.error ?? "Upload failed. Please try again.",
        );
      }
      setOpen(false);
      setFile(null);
      setTitle("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UploadCloud className="h-4 w-4" />
        Upload PDF
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-sm"
          onClick={() => !uploading && setOpen(false)}
        >
          <div
            className="w-full max-w-md animate-slide-up rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Upload a PDF</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => !uploading && setOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

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
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950"
                    : "border-zinc-300 hover:border-brand-400 dark:border-zinc-700",
                )}
              >
                {file ? (
                  <>
                    <FileText className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-zinc-500">
                      {formatBytes(file.size)} · click to change
                    </p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-zinc-400" />
                    <p className="text-sm font-medium">
                      Drop your PDF here or{" "}
                      <span className="text-brand-600 dark:text-brand-400">
                        browse
                      </span>
                    </p>
                    <p className="text-xs text-zinc-500">PDF up to 20 MB</p>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => onFiles(e.target.files)}
                />
              </div>

              <Input
                id="doc-title"
                label="Title (optional)"
                placeholder="Lecture 4 — Photosynthesis"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={uploading} disabled={!file}>
                  {uploading ? "Uploading…" : "Upload"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
