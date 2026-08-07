"use client";

import { useEffect, useRef } from "react";

const TICK_MS = 30_000;
const FLUSH_MS = 60_000;

/**
 * Tracks active time spent in the app and reports it to /api/study-time
 * in 1-minute chunks. Only counts time while the tab is visible.
 */
export function StudyTimer() {
  const accumulated = useRef(0);
  const lastTick = useRef(Date.now());
  const flushing = useRef(false);

  useEffect(() => {
    const send = async (seconds: number) => {
      if (seconds < 1) return;
      try {
        await fetch("/api/study-time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seconds }),
          keepalive: true,
        });
      } catch {
        // Best-effort; drop the report if the request fails.
      }
    };

    const flushNow = () => {
      const now = Date.now();
      accumulated.current += now - lastTick.current;
      lastTick.current = now;
      const seconds = Math.round(accumulated.current / 1000);
      if (seconds >= 1 && !flushing.current) {
        flushing.current = true;
        accumulated.current = 0;
        void send(seconds).finally(() => {
          flushing.current = false;
        });
      }
    };

    const onTick = () => {
      if (document.visibilityState !== "visible") {
        lastTick.current = Date.now();
        return;
      }
      accumulated.current += Date.now() - lastTick.current;
      lastTick.current = Date.now();
      if (accumulated.current >= FLUSH_MS) flushNow();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        lastTick.current = Date.now();
      } else {
        flushNow();
      }
    };

    const interval = window.setInterval(onTick, TICK_MS);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onVisibility);
      flushNow();
    };
  }, []);

  return null;
}
