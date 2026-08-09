"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackPageView } from "@/lib/analytics-events";

/**
 * Global Google Analytics 4 loader.
 *
 * Mounted once in the root layout. Loads the gtag.js snippet when
 * NEXT_PUBLIC_GA_ID is set, and reports page views for every route change
 * (including client-side navigation) via usePathname.
 *
 * This is entirely separate from the Google AdSense loader and never touches
 * the publisher ID or ad units.
 */
export function Analytics() {
  const pathname = usePathname();

  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  useEffect(() => {
    if (!gaId) return;
    trackPageView(pathname ?? "/");
  }, [pathname, gaId]);

  if (!gaId) return null;

  return (
    <>
      <Script
        id="gtag-base"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
