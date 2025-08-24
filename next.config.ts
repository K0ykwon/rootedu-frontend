import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow production builds to successfully complete even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Fix chromadb webpack issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Ignore external dependencies that cause build issues
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        'chromadb-default-embed': 'commonjs chromadb-default-embed',
      });
    }

    // Handle external URLs in chromadb
    config.module.rules.push({
      test: /node_modules\/chromadb\/.*\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
  
  // Disable strict mode temporarily to avoid build issues
  reactStrictMode: false,
  
  // Skip static generation for API routes with dependencies issues
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
