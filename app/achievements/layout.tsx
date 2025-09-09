import { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Achievements | Eorzean Compass",
  description: "View and track your FFXIV achievements with TSR-G analysis",
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#f59e0b',
  colorScheme: 'dark',
};

export default function AchievementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}