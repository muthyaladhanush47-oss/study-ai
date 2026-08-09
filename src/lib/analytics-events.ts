"use client";

/**
 * Small reusable Google Analytics 4 helper.
 *
 * - Reads the Measurement ID from NEXT_PUBLIC_GA_ID (inlined at build time).
 * - All helpers no-op when the ID is missing, so Analytics is inert unless
 *   the site owner configures it.
 * - No personal information is collected; events only carry non-identifying
 *   metadata (document count, format, etc.).
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

type GtagEventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Track an arbitrary event (only fires when GA4 is configured). */
export function trackEvent(eventName: string, params?: GtagEventParams) {
  if (!GA_ID || typeof window === "undefined") return;
  const { gtag } = window;
  if (typeof gtag !== "function") return;
  gtag("event", eventName, params);
}

/** Send a page_view for the given client-side route path. */
export function trackPageView(path: string) {
  if (!GA_ID || typeof window === "undefined") return;
  const { gtag } = window;
  if (typeof gtag !== "function") return;
  gtag("config", GA_ID, { page_path: path });
}
