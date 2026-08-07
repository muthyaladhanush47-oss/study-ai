import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist", "pdf-to-img"],
};

export default nextConfig;
