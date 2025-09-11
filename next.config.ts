import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config: any) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
  // Disable PWA for now to avoid build issues
  // Will re-enable after successful deployment
};

export default nextConfig;
