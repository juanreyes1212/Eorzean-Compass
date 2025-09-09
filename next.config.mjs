/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  
  // Optimize for Bun runtime
  experimental: {
    serverComponentsExternalPackages: [],
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Image optimization for Netlify with FFXIV icon support
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ffxivcollect.com',
        port: '',
        pathname: '/images/**', // For achievement icons from FFXIV Collect
      },
      {
        protocol: 'https',
        hostname: 'tomestone.gg',
        port: '',
        pathname: '/images/**', // Assuming Tomestone.gg serves avatars/images
      },
      {
        protocol: 'https',
        hostname: 'img2.finalfantasyxiv.com', // Added for character avatars
        port: '',
        pathname: '/**', 
      },
    ],
    dangerouslyAllowSVG: true, // Allow SVG from remote patterns if needed
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // Strict CSP
  },
  
  // Performance optimizations
  compiler: {
    // Set removeConsole to false to see console.log messages in production logs.
    // Remember to set this back to `process.env.NODE_ENV === 'production'` for final deployment.
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // ESLint and TypeScript configurations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Webpack configuration for Netlify
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Bundle analysis
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-analysis.html',
        })
      );
    }
    
    return config;
  },
  
  // PWA configuration
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
};

export default nextConfig;