"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from 'lucide-react';
import { TSRGFiltersComponent, type TSRGFilters } from "@/components/tsrg-filters";
import { AchievementTableView } from "@/components/achievements/achievement-table-view";
import { type AchievementWithTSRG } from "@/lib/tsrg-matrix";
import { useFilters } from "@/lib/hooks/useFilters";

interface AchievementTablePaginatedProps {
  characterId: string;
  completedAchievements?: Array<{ id: number; completionDate: string }>;
  allAchievements?: AchievementWithTSRG[];
}

export function AchievementTablePaginated({ 
  characterId, 
  completedAchievements = [],
  allAchievements = []
}: AchievementTablePaginatedProps) {
  const searchParams = useSearchParams();
  const { filters, setFilter, applyFilters } = useFilters();
  
  // Get filter parameters from URL
  const categoryFilter = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("query") || "";
  
  // Apply filters to get filtered achievements
  const filteredAchievements = useMemo(() => {
    let filtered = applyFilters(allAchievements);
    
    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (achievement) => achievement.category.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (achievement) =>
          achievement.name.toLowerCase().includes(query) ||
          achievement.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [allAchievements, applyFilters, categoryFilter, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = allAchievements.length;
    const completed = allAchievements.filter(a => a.isCompleted).length;
    const obtainable = allAchievements.filter(a => a.isObtainable).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      total,
      completed,
      obtainable,
      completionRate,
      filtered: filteredAchievements.length,
    };
  }, [allAchievements, filteredAchievements]);

  if (allAchievements.length === 0) {
    return (
      <div className="space-y-6">
        <TSRGFiltersComponent filters={filters} onFiltersChange={setFilter} />
        <div className="flex items-center justify-center py-8">
          <div className="text-white">Loading achievements...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="compass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-sm text-compass-300">Completion Rate</span>
          </div>
          <div className="text-2xl font-bold text-compass-100">{stats.completionRate}%</div>
          <Progress value={stats.completionRate} className="mt-2 h-2" />
        </div>
        
        <div className="compass-card p-4">
          <div className="text-sm text-compass-300 mb-2">Completed</div>
          <div className="text-2xl font-bold text-compass-100">{stats.completed}</div>
          <div className="text-xs text-compass-400">of {stats.total} total</div>
        </div>
        
        <div className="compass-card p-4">
          <div className="text-sm text-compass-300 mb-2">Obtainable</div>
          <div className="text-2xl font-bold text-compass-100">{stats.obtainable}</div>
          <div className="text-xs text-compass-400">achievements available</div>
        </div>
        
        <div className="compass-card p-4">
          <div className="text-sm text-compass-300 mb-2">Filtered Results</div>
          <div className="text-2xl font-bold text-compass-100">{stats.filtered}</div>
          <div className="text-xs text-compass-400">matching criteria</div>
        </div>
      </div>

      {/* TSR-G Filters */}
      <TSRGFiltersComponent filters={filters} onFiltersChange={setFilter} />
      
      {/* Achievement Table */}
      <AchievementTableView achievements={filteredAchievements} />
    </div>
  );
}
