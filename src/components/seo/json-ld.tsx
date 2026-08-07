import Script from "next/script";

/**
 * Injects a JSON-LD structured-data block. Server component only.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <Script
      id={`json-ld-${data["@type"] ?? "schema"}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
