import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientAchievementsPage } from "@/components/client-achievements-page";
import Loading from "./loading"; // Import the loading component

interface PageProps {
  searchParams: { name?: string; server?: string };
}

export default function AchievementsPage({ searchParams }: PageProps) {
  const { name, server } = searchParams;
  
  if (!name || !server) {
    // Show error message if no character is specified
    return (
      <div className="min-h-screen bg-compass-950 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4 text-compass-100">No Character Selected</h1>
          <p className="mb-8 text-compass-300">Please return to the home page and search for a character.</p>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Pass the search params to the client component
  return (
    <Suspense fallback={<Loading />}>
      <ClientAchievementsPage name={decodeURIComponent(name)} server={decodeURIComponent(server)} />
    </Suspense>
  );
}