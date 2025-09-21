import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable API routes with extended timeouts
  trailingSlash: true,
  images: {
    unoptimized: true
  },
};

export default nextConfig;
