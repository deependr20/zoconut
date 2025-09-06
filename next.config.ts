import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Temporarily disable ESLint during build for performance testing
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Experimental features for better performance
  experimental: {
    optimizeCss: false,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Bundle analyzer for production builds
  webpack: (config, { dev, isServer }) => {
    // Optimize for production
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        animations: {
          name: 'animations',
          test: /[\\/]node_modules[\\/].*animation.*[\\/]/,
          chunks: 'all',
          priority: 10,
        },
      };
    }

    return config;
  },
};

export default nextConfig;
