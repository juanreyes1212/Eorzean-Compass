"use client";

import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from 'lucide-react';

export function SearchFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialQuery = searchParams.get("query") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== initialQuery) {
        const params = new URLSearchParams(searchParams.toString());
        
        if (searchQuery) {
          params.set("query", searchQuery);
        } else {
          params.delete("query");
        }
        
        router.push(`/achievements?${params.toString()}`);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery, initialQuery, router, searchParams]);
  
  return (
    <div className="relative w-full sm:w-[300px]">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-compass-400" />
      <Input
        type="text"
        placeholder="Search achievements..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 bg-compass-800 border-compass-600 text-compass-100 placeholder:text-compass-400 focus:border-gold-500 focus:ring-gold-500/20"
      />
    </div>
  );
}
