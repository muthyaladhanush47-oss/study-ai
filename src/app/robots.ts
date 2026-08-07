import type { MetadataRoute } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://study-ai-two-sable.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/profile", "/api/"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
