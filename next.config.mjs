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
    domains: [
      'xivapi.com', 
      'img2.finalfantasyxiv.com',
      'ffxivcollect.com'
    ],
    formats: ['image/webp', 'image/avif'],
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
