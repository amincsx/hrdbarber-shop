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

  // External packages for server components
  serverExternalPackages: ['mongodb'],

  webpack: (config: any) => {
    config.resolve.fallback = { fs: false, path: false };

    // Disable TypeScript checking in webpack
    config.plugins = config.plugins.filter((plugin: any) => {
      return plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin';
    });

    // Force all modules to be treated as ES modules
    config.resolve.extensionAlias = {
      ".js": [".js", ".ts"],
      ".jsx": [".jsx", ".tsx"],
    };

    // Configure module resolution to handle all file types as ES modules
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false
      }
    });

    // Disable warnings that might be treated as module errors
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found/,
      /Can't resolve/,
      /Failed to parse source map/,
      /is not a module/
    ];

    return config;
  },
};

export default nextConfig;
