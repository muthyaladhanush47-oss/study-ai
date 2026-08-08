import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist", "pdf-to-img"],
  // pdfjs-dist locates cmaps/standard_fonts at runtime via
  // createRequire().resolve(), which the file tracer cannot see statically.
  // Ship them explicitly so page rendering never breaks on Vercel.
  outputFileTracingIncludes: {
    "/api/ocr": [
      "./node_modules/pdfjs-dist/cmaps/**/*",
      "./node_modules/pdfjs-dist/standard_fonts/**/*",
      "./node_modules/pdfjs-dist/wasm/**/*",
      "./node_modules/pdfjs-dist/legacy/build/**/*",
      "./node_modules/@napi-rs/canvas/**/*",
    ],
  },
};

export default nextConfig;
