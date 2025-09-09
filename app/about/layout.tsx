import { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "About | Eorzean Compass",
  description: "Learn about the TSR-G Matrix system and how Eorzean Compass helps FFXIV players track achievements",
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#f59e0b',
  colorScheme: 'dark',
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}