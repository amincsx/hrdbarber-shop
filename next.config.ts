import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
    dirs: [], // Don't run ESLint on any directories during build
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config: any) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
};

export default nextConfig;
