import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import Link from "next/link";
import { Compass } from 'lucide-react';
import { Toaster } from "@/components/ui/toaster"; // Import the Toaster component
import { ErrorBoundaryWrapper } from "@/components/error-boundary-wrapper";
import { PerformanceMonitor } from "@/components/performance-monitor";
import { createSkipLink } from "@/lib/utils/accessibility";
import { useEffect } from "react";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Eorzean Compass | FFXIV Achievement Tracker",
  description: "Navigate your FFXIV achievement journey with the definitive companion tool for achievement hunters",
  generator: 'Next.js',
  manifest: '/manifest.json',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  themeColor: '#f59e0b',
  colorScheme: 'dark',
  robots: 'index, follow',
  openGraph: {
    title: 'Eorzean Compass | FFXIV Achievement Tracker',
    description: 'Navigate your FFXIV achievement journey with the definitive companion tool for achievement hunters',
    type: 'website',
    locale: 'en_US',
    siteName: 'Eorzean Compass',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eorzean Compass | FFXIV Achievement Tracker',
    description: 'Navigate your FFXIV achievement journey with the definitive companion tool for achievement hunters',
  },
  keywords: ['FFXIV', 'Final Fantasy XIV', 'achievements', 'tracker', 'gaming', 'MMO'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Add skip link for accessibility
    createSkipLink('main-content', 'Skip to main content');
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-compass-950 text-compass-100 border-b border-compass-700">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-white flex items-center gap-3 group">
              <div className="relative">
                <Compass className="h-8 w-8 text-gold-400 group-hover:animate-compass-spin transition-all duration-300" />
                <div className="absolute inset-0 rounded-full gold-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-gold-400 text-lg leading-tight">Eorzean</span>
                <span className="text-compass-200 text-base leading-tight">Compass</span>
              </div>
            </Link>
            <nav>
              <ul className="flex gap-6">
                <li>
                  <Link href="/" className="text-compass-300 hover:text-gold-400 transition-colors duration-200 font-medium">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-compass-300 hover:text-gold-400 transition-colors duration-200 font-medium">
                    About
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <ErrorBoundaryWrapper>
          <main id="main-content" className="min-h-screen" tabIndex={-1}>
            {children}
          </main>
        </ErrorBoundaryWrapper>
        <footer className="bg-compass-950 text-compass-100 border-t border-compass-700 py-8 mt-12">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Compass className="h-5 w-5 text-gold-400" />
              <span className="text-gold-400 font-semibold">Eorzean Compass</span>
            </div>
            <p className="text-compass-400 text-sm mb-2">
              Navigate your achievement journey across the realm of Eorzea
            </p>
            <p className="text-compass-500 text-xs">
              Eorzean Compass is not affiliated with Square Enix.
            </p>
            <p className="text-compass-500 text-xs mt-1">
              FINAL FANTASY XIV © 2010 - 2023 SQUARE ENIX CO., LTD. All Rights Reserved.
            </p>
          </div>
        </footer>
        <Toaster /> {/* Add the Toaster component here */}
        <PerformanceMonitor />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}