"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from 'lucide-react';

const categories = [
  { value: "all", label: "All Categories" },
  { value: "battle", label: "Battle" },
  { value: "pvp", label: "PvP" },
  { value: "character", label: "Character" },
  { value: "items", label: "Items" },
  { value: "crafting", label: "Crafting & Gathering" },
  { value: "quests", label: "Quests" },
  { value: "exploration", label: "Exploration" },
  { value: "grand_company", label: "Grand Company" },
  { value: "legacy", label: "Legacy" },
];

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentCategory = searchParams.get("category") || "all";
  
  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (category === "all") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    
    router.push(`/achievements?${params.toString()}`);
  };
  
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-compass-400" />
      <Select value={currentCategory} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-[200px] bg-compass-800 border-compass-600 text-compass-100 focus:border-gold-500 focus:ring-gold-500/20">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent className="bg-compass-800 border-compass-600">
          {categories.map((category) => (
            <SelectItem 
              key={category.value} 
              value={category.value}
              className="text-compass-100 hover:bg-compass-700 focus:bg-compass-700"
            >
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
