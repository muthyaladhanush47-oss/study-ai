"use client";

import { useState } from "react";
import { UploadDialog } from "@/components/upload-dialog";
import { OcrRunner } from "@/components/ocr-runner";

export function DashboardClient() {
  const [ocr, setOcr] = useState<{ documentId: string; title: string } | null>(
    null,
  );

  return (
    <>
      <UploadDialog
        onUploaded={(result) => {
          if (result.needsOcr) {
            setOcr({
              documentId: result.documentId,
              title: "Handwritten or scanned content detected — transcribing now",
            });
          }
        }}
      />
      <OcrRunner
        open={Boolean(ocr)}
        onOpenChange={(open) => {
          if (!open) setOcr(null);
        }}
        documentId={ocr?.documentId ?? null}
        title={ocr?.title}
      />
    </>
  );
}
