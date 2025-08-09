/** @type {import('next').NextConfig} */
const nextConfig = {
  // Netlify-specific optimizations
  output: 'standalone',
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
    unoptimized: process.env.NODE_ENV === 'production', // Netlify handles optimization
  },
  
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Headers for better caching (also defined in netlify.toml)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
    ];
  },
  
  // Redirects (also defined in netlify.toml for redundancy)
  async redirects() {
    return [
      {
        source: '/character',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // ESLint and TypeScript configurations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
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
