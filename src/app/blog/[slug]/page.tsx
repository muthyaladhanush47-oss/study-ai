import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, CalendarDays, Clock } from "lucide-react";
import { MarketingShell } from "@/components/seo/marketing-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { GoogleAd } from "@/components/ads/google-ad";
import { blogPosts } from "@/content/blog";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://study-ai-two-sable.vercel.app";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} — StudyAI Blog`,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: `${post.title} — StudyAI`,
      description: post.description,
      url: `${baseUrl}/blog/${post.slug}`,
      type: "article",
    },
  };
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export default async function BlogArticlePage({ params }: Params) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "StudyAI" },
    mainEntityOfPage: `${baseUrl}/blog/${post.slug}`,
  };

  return (
    <MarketingShell
      nav={[
        { href: "/", label: "Home" },
        { href: "/blog", label: "Blog" },
      ]}
    >
      <JsonLd data={articleSchema} />
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All articles
        </Link>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {new Date(post.date).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {post.readingTime}
          </span>
        </div>

        <div className="mt-10 space-y-5">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => (
                <h2 className="mt-10 text-2xl font-bold tracking-tight">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mt-8 text-xl font-bold tracking-tight">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="leading-relaxed text-foreground/90">{children}</p>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {children}
                </a>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">
                  {children}
                </strong>
              ),
              ol: ({ children }) => (
                <ol className="ml-5 list-decimal space-y-2">{children}</ol>
              ),
              ul: ({ children }) => (
                <ul className="ml-5 list-disc space-y-2">{children}</ul>
              ),
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="rounded-xl border-l-4 border-primary bg-muted/40 px-5 py-3 text-muted-foreground">
                  {children}
                </blockquote>
              ),
              pre: ({ children }) => (
                <pre className="nice-scroll overflow-x-auto rounded-xl bg-muted p-4 text-sm leading-relaxed">
                  {children}
                </pre>
              ),
              code: ({ className, children }) => (
                <code
                  className={`${className ?? ""} whitespace-pre-wrap break-words`}
                >
                  {children}
                </code>
              ),
            }}
          >
            {post.body}
          </ReactMarkdown>
        </div>

        <GoogleAd slot="studyai-blog" format="auto" className="mt-12 min-h-24" />
      </article>
    </MarketingShell>
  );
}
