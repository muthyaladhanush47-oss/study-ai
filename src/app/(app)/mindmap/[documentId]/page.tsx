import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUser, createClient } from "@/lib/supabase/server";
import { MindMapView } from "@/components/mind-map-view";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Mind map",
};

export const dynamic = "force-dynamic";

export default async function MindMapPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const user = await getUser();
  if (!user) notFound();

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("id, title, text_source, is_ocr_ready")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();

  if (!doc) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" aria-label="Back to dashboard">
            <ArrowLeft />
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
            Mind map
          </h1>
          <p className="truncate text-sm text-muted-foreground">{doc.title}</p>
        </div>
      </div>
      <MindMapView documentId={documentId} />
    </div>
  );
}
