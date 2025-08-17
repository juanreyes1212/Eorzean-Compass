import { AchievementTablePaginated } from "@/components/achievement-table-paginated"; // Corrected import
import { CategoryFilter } from "@/components/category-filter";
import { SearchFilter } from "@/components/search-filter";
import { CharacterProfile } from "@/components/character-profile";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientAchievementsPage } from "@/components/client-achievements-page";

interface PageProps {
  searchParams: { name?: string; server?: string };
}

export default function AchievementsPage({ searchParams }: PageProps) {
  const { name, server } = searchParams;
  
  if (!name || !server) {
    // Show error message if no character is specified
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4 text-white">No Character Selected</h1>
          <p className="mb-8 text-slate-300">Please return to the home page and search for a character.</p>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Pass the search params to the client component
  return <ClientAchievementsPage name={decodeURIComponent(name)} server={decodeURIComponent(server)} />;
}