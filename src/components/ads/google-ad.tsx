"use client";

import { useEffect, useRef } from "react";
import { Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

type GoogleAdProps = {
  slot: string;
  format?: "auto" | "horizontal" | "rectangle" | "fluid";
  className?: string;
  /** Falls back to a subtle placeholder when AdSense isn't configured. */
  placeholder?: boolean;
};

export function GoogleAd({
  slot,
  format = "auto",
  className,
  placeholder = true,
}: GoogleAdProps) {
  const adClient = process.env.NEXT_PUBLIC_AD_CLIENT;
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!adClient) return;
    const win = window as unknown as {
      adsbygoogle?: unknown[];
    };
    try {
      if (!pushedRef.current) {
        pushedRef.current = true;
        win.adsbygoogle = win.adsbygoogle || [];
        win.adsbygoogle.push({});
      }
    } catch {
      // AdSense throws when the ad can't render; ignore.
    }
  }, [adClient]);

  if (!adClient) {
    if (!placeholder) return null;
    return (
      <div
        aria-hidden
        className={cn(
          "flex h-24 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 text-xs text-muted-foreground",
          className,
        )}
      >
        <Megaphone className="h-4 w-4" />
        Advertisement
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden", className)}>
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={adClient}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
