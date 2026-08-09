"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MindMapNode } from "@/types";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics-events";

function layoutTree(
  root: MindMapNode,
  { xGap = 240, yGap = 48 }: { xGap?: number; yGap?: number } = {},
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function walk(node: MindMapNode, depth: number, x: number, y: number, parentId?: string) {
    const id = `n-${depth}-${x}-${y}`;
    nodes.push({
      id,
      position: { x, y },
      data: { label: node.label, depth },
    });
    if (parentId) {
      edges.push({
        id: `e-${parentId}-${id}`,
        source: parentId,
        target: id,
        type: "smoothstep",
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: "#a855f7", strokeWidth: 1.5 },
      });
    }
    const children = node.children ?? [];
    const totalHeight = Math.max((children.length - 1) * yGap, 0);
    let cy = y - totalHeight / 2;
    for (const child of children) {
      walk(child, depth + 1, x + xGap, cy, id);
      cy += yGap;
    }
  }

  walk(root, 0, 0, 0);
  return { nodes, edges };
}

function MindNode({ data }: NodeProps) {
  const { label, depth } = data as { label: string; depth: number };
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-2.5 text-center text-sm font-medium shadow-sm backdrop-blur",
        depth === 0
          ? "border-primary/40 bg-gradient-to-br from-emerald-600 to-emerald-400 text-primary-foreground shadow-lg"
          : depth === 1
            ? "border-emerald-400/40 bg-card"
            : "border-border bg-card/90",
      )}
      style={{ maxWidth: 200 }}
    >
      {label}
    </div>
  );
}

const nodeTypes = { mindNode: MindNode };

export function MindMapView({ documentId }: { documentId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [root, setRoot] = useState<MindMapNode | null>(null);
  const [expanded, setExpanded] = useState<boolean>(true);

  const { nodes, edges } = useMemo(
    () => (root ? layoutTree(root) : { nodes: [], edges: [] }),
    [root, expanded],
  );

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Could not generate the mind map.");
      }
      const data = (await res.json()) as { root: MindMapNode };
      setRoot(data.root);
      setExpanded(true);
      trackEvent("mindmap_created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    generate();
  }, [generate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 py-20 text-center">
        <p className="max-w-sm text-sm text-destructive">{error}</p>
        <Button onClick={generate}>Try again</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card">
        {root ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Laying out the map…
          </div>
        ) : (
          <button
            type="button"
            onClick={generate}
            className="flex flex-col items-center gap-3"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-400 text-white shadow-lg">
              <Network className="h-7 w-7" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Generate mind map
            </span>
            <span className="max-w-xs text-center text-xs text-muted-foreground">
              StudyAI will read the whole document and build a structured map of
              the main topics.
            </span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5">
        <p className="text-xs font-medium text-muted-foreground">
          {nodes.length} nodes · drag to pan · scroll to zoom
        </p>
        <Button size="xs" variant="outline" onClick={generate}>
          Regenerate
        </Button>
      </div>
      <div className="h-[65vh]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
          nodesConnectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} />
          <Controls position="bottom-left" />
        </ReactFlow>
      </div>
    </div>
  );
}
