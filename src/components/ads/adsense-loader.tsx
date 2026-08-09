"use client";

/**
 * Loads the Google AdSense loader script once, only when a publisher ID is set.
 * Individual ad units (see GoogleAd) render nothing until this is configured.
 *
 * Uses a plain <script async src> element (not next/script) so React 19 hoists
 * the literal tag into the server-rendered <head>, which Google's AdSense
 * verification crawler requires to find the snippet in raw HTML.
 */
export function AdsenseLoader({ adClient }: { adClient?: string }) {
  if (!adClient) return null;

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
      crossOrigin="anonymous"
    />
  );
}
