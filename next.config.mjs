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
    ],
    dangerouslyAllowSVG: true, // Allow SVG from remote patterns if needed
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // Strict CSP
  },
  
  // Performance optimizations
  compiler: {
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
    return config;
  },
};

export default nextConfig;