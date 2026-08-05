"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  Brain,
  FileText,
  Layers,
  Loader2,
  MessageSquareText,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import type { DocumentRecord } from "@/types";
import { Button } from "@/components/ui/button";

const actions = [
  { href: "/chat", label: "Chat", icon: MessageSquareText },
  { href: "/summaries", label: "Summarize", icon: Layers },
  { href: "/flashcards", label: "Flashcards", icon: Brain },
  { href: "/quiz", label: "Quiz", icon: Brain },
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

  async function handleDelete() {
    if (!confirm(`Delete "${document.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/documents/${document.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      setDeleting(false);
      alert("Failed to delete the document.");
    }
  }

  return (
    <div className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-brand-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
          <FileText className="h-5 w-5" />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          loading={deleting}
          aria-label="Delete document"
          className="text-zinc-400 hover:text-red-500 dark:text-zinc-500"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <h3 className="mt-4 truncate font-semibold" title={document.title}>
        {document.title}
      </h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {formatDate(document.created_at)}
        {" · "}
        {formatBytes(document.file_size)}
        {document.page_count != null && document.page_count > 0
          ? ` · ${document.page_count} pages`
          : ""}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <a
            key={action.label}
            href={`${action.href}/${document.id}`}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-2 py-2 text-xs font-medium text-zinc-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-brand-700 dark:hover:bg-brand-950 dark:hover:text-brand-300"
          >
            <action.icon className="h-3.5 w-3.5" />
            {action.label}
          </a>
        ))}
      </div>

      <a
        href={signedUrl ?? "#"}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "mt-3 text-center text-xs font-medium",
          signedUrl
            ? "text-brand-600 underline-offset-4 hover:underline dark:text-brand-400"
            : "pointer-events-none text-zinc-300 dark:text-zinc-600",
        )}
      >
        Open original PDF
      </a>
    </div>
  );
}
