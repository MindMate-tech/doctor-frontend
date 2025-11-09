import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  turbopack: {
    // Explicitly set project root so Next.js doesn't try to infer it from parent lockfiles
    root: __dirname,
  },
};

export default nextConfig;
