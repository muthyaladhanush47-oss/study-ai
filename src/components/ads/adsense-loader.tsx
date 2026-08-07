"use client";

import Script from "next/script";

/**
 * Loads the Google AdSense loader script once, only when a publisher ID is set.
 * Individual ad units (see GoogleAd) render nothing until this is configured.
 */
export function AdsenseLoader({ adClient }: { adClient?: string }) {
  if (!adClient) return null;

  return (
    <Script
      id="adsense-script"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
      async
    />
  );
}
