import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { geminiGenerateText } from "@/lib/gemini";
import { extractJson } from "@/lib/ai/extract";
import { getOwnedDocument, logActivity } from "@/lib/ai/document";
import type { MindMapNode } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM = [
  "You are an expert study assistant who builds mind maps.",
  "Convert the provided study notes into a structured mind map that helps a student understand and memorize the material.",
  'Return ONLY valid JSON matching this exact schema: {"label": string, "children": [{"label": string, "children": [{"label": string, "children": [...]}]}]}.',
  "The root label should be the document title or main topic.",
  "Use 3-6 branches from the root, each branch 2-3 levels deep. Labels must be short (max 6 words).",
  "Do not include any text outside the JSON.",
].join("\n");

const MAX_DEPTH = 4;
const MAX_NODES = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { documentId?: string };
  const documentId = body.documentId;

  if (!documentId) {
    return NextResponse.json(
      { error: "documentId is required" },
      { status: 400 },
    );
  }

  const doc = await getOwnedDocument(supabase, user.id, documentId);
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (!doc.content.trim()) {
    return NextResponse.json(
      { error: "This PDF has no extractable text to map." },
      { status: 422 },
    );
  }

  const raw = await geminiGenerateText({
    system: SYSTEM,
    messages: [{ role: "user", content: doc.content }],
    temperature: 0.3,
    maxTokens: 4096,
    json: true,
  });

  const parsed = extractJson<{ label?: string; children?: MindMapNode[] }>(raw);

  const root: MindMapNode = sanitizeNode(
    {
      label: parsed.label || doc.title,
      children: Array.isArray(parsed.children) ? parsed.children : [],
    },
    MAX_DEPTH,
    { nodes: 0 },
  );

  await logActivity(supabase, {
    userId: user.id,
    documentId: doc.id,
    type: "summary",
    title: `Mind map of ${doc.title}`,
    metadata: { nodeCount: countNodes(root) },
  });

  return NextResponse.json({ root });
}

function sanitizeNode(
  node: MindMapNode,
  depth: number,
  counter: { nodes: number },
): MindMapNode {
  if (depth <= 0 || counter.nodes >= MAX_NODES) {
    return { label: String(node.label ?? "").slice(0, 80) };
  }

  counter.nodes += 1;

  const children = Array.isArray(node.children)
    ? node.children.slice(0, 8).map((child) =>
        sanitizeNode(child, depth - 1, counter),
      )
    : [];

  return {
    label: String(node.label ?? "").slice(0, 80),
    children: children.length ? children : undefined,
  };
}

function countNodes(node: MindMapNode): number {
  return 1 + (node.children?.reduce((sum, c) => sum + countNodes(c), 0) ?? 0);
}
