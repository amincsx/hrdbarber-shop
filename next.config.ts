import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  // Completely disable ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
    dirs: [],
  },

  // Completely disable TypeScript checking during builds
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: undefined, // Don't use tsconfig for builds
  },

  // Disable typed routes
  typedRoutes: false,

  webpack: (config: any) => {
    config.resolve.fallback = { fs: false, path: false };

    // Disable TypeScript checking in webpack
    config.plugins = config.plugins.filter((plugin: any) => {
      return plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin';
    });

    return config;
  },
};

export default nextConfig;
