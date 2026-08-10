import type { MetadataRoute } from "next";
import { blogPosts } from "@/content/blog";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://study-ai-two-sable.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages = [
    { path: "", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/notes", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/pdf-summarizer", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/ai-note-generator", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/ocr", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/quiz", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/flashcards", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/mindmap", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/blog", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/contact", changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/disclaimer", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/login", changeFrequency: "monthly" as const, priority: 0.6 },
    { path: "/signup", changeFrequency: "monthly" as const, priority: 0.6 },
  ];

  return [
    ...staticPages.map((p) => ({
      url: `${appUrl}${p.path}`,
      lastModified: now,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),
    ...blogPosts.map((post) => ({
      url: `${appUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
