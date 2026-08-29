import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kërkohet nga Dockerfile-i i prodhimit (`.next/standalone`) — pa këtë,
  // stage-i `runner` (jo-Vercel/self-hosted) do t'i mungonte server.js.
  output: "standalone",
};

export default nextConfig;
