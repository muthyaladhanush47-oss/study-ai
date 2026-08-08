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
import { createClient } from "@/lib/supabase/client";

const MAX_SIZE = 100 * 1024 * 1024;

type UploadResult = { document: { id: string }; needsOcr: boolean };

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

/**
 * Uploads the file directly from the browser to Supabase Storage using the
 * authenticated user's token (RLS applies) instead of POSTing it through a
 * Vercel function, which caps request bodies. Mirrors what @supabase/storage-js
 * does for a plain `upload()` call, but with a progress callback.
 *
 * The URL below is the Supabase Storage endpoint — never a Vercel API route.
 */
function uploadToStorage(
  file: File,
  filePath: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const endpoint = `${supabaseUrl}/storage/v1/object/documents/${encodeStoragePath(filePath)}`;

  return new Promise((resolve, reject) => {
    createClient()
      .auth.getSession()
      .then(({ data }) => {
        const token = data.session?.access_token;
        if (!token) {
          reject(new Error("You must be signed in to upload files."));
          return;
        }

        const form = new FormData();
        form.append("cacheControl", "3600");
        form.append("", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", endpoint);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("x-upsert", "false");

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && e.total > 0) {
            onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress(100);
            resolve();
            return;
          }
          let message = `Upload failed (${xhr.status}).`;
          try {
            const body = JSON.parse(xhr.responseText) as {
              message?: string;
              error?: string;
            };
            if (body.message) message = body.message;
            else if (body.error) message = body.error;
          } catch {
            // response body was not JSON
          }
          if (xhr.status === 413) {
            message =
              "Supabase Storage rejected this file (413). Check the documents bucket file-size limit.";
          }
          reject(new Error(message));
        };

        xhr.onerror = () =>
          reject(
            new Error(
              "Storage upload failed. Check your connection and try again.",
            ),
          );

        xhr.send(form);
      })
      .catch(() => {
        reject(new Error("Could not start the upload. Please try again."));
      });
  });
}

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
  const [progress, setProgress] = useState<number | null>(null);
  const [stage, setStage] = useState<"storage" | "create" | null>(null);
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
    setProgress(0);
    setError(null);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      setUploading(false);
      setError("You must be signed in to upload files.");
      return;
    }

    const ext = file.name.toLowerCase().split(".").pop() ?? "";
    const filePath = `${userId}/${crypto.randomUUID()}.${ext}`;

    try {
      // Step 1: send ONLY the file bytes to Supabase Storage (not Vercel).
      setStage("storage");
      await uploadToStorage(file, filePath, setProgress);

      // Step 2: register the document with /api/documents/create using ONLY
      // small JSON metadata. The PDF bytes never touch this request.
      const metadata = JSON.stringify({
        filePath,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        title: title.trim() || undefined,
      });

      setStage("create");
      let res: Response;
      try {
        res = await fetch("/api/documents/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: metadata,
        });
      } catch {
        await supabase.storage
          .from("documents")
          .remove([filePath])
          .catch(() => {});
        throw new Error(
          "Document creation failed — could not reach the server. The uploaded file was removed; please try again.",
        );
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);

        // The server does not keep orphaned files; remove anything left behind.
        await supabase.storage
          .from("documents")
          .remove([filePath])
          .catch(() => {});
        if (res.status === 413) {
          throw new Error(
            "The document creation API received an unexpectedly large request. The PDF must be uploaded directly to Storage.",
          );
        }
        throw new Error(
          body?.error ?? `Document creation failed (HTTP ${res.status}).`,
        );
      }

      const data = (await res.json()) as UploadResult;
      setOpen(false);
      setFile(null);
      setTitle("");
      setProgress(null);
      setStage(null);
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
              textbook page — StudyAI reads them all. Max 100 MB.
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
                    PDF, JPG, PNG or WebP up to 100 MB
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

            {uploading && (
              <div className="space-y-1.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all duration-200"
                    style={{ width: `${Math.max(progress ?? 0, 2)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {progress === 100
                    ? "Preparing document…"
                    : progress != null
                      ? `Uploading file… ${progress}%`
                      : "Uploading file…"}
                </p>
              </div>
            )}

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
