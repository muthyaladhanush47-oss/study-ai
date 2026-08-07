import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Clock, PenLine } from "lucide-react";
import { MarketingShell } from "@/components/seo/marketing-shell";
import { blogPosts } from "@/content/blog";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://study-ai-two-sable.vercel.app";

export const metadata: Metadata = {
  title: "Study Tips Blog — Learn How to Study Smarter",
  description:
    "Evidence-backed study tips for students: AI PDF summarization, better note-taking, handwriting OCR, flashcards and active recall. Free guides from StudyAI.",
  alternates: { canonical: "/blog" },
  openGraph: { title: "Study Tips Blog — StudyAI", url: `${baseUrl}/blog` },
};

export default function BlogPage() {
  return (
    <MarketingShell
      nav={[
        { href: "/", label: "Home" },
        { href: "/notes", label: "AI Notes" },
        { href: "/blog", label: "Blog" },
      ]}
    >
      <section className="relative overflow-hidden border-b border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <PenLine className="h-3.5 w-3.5" />
            Study tips & guides
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Study smarter, not harder
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Practical, evidence-backed guides on notes, flashcards, OCR, AI
            summarization and more.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
            >
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readingTime}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-bold tracking-tight group-hover:text-primary">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {post.description}
                </p>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary"
                >
                  Read
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
