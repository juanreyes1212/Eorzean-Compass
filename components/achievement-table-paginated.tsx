"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AchievementStats } from "./achievement-table/AchievementStats";
import { AchievementTableContent } from "./achievement-table/AchievementTableContent";
import { AchievementTablePagination } from "./achievement-table/AchievementTablePagination";
import { calculateTSRGScore } from "@/lib/tsrg-matrix";
import { AchievementWithTSRG, UserPreferences, SortColumn, SortDirection, CompletedAchievement } from "@/lib/types"; // Import SortColumn, SortDirection, CompletedAchievement
import { PAGINATION } from "@/lib/constants"; // Import from constants

interface AchievementTablePaginatedProps {
  characterId: string;
  completedAchievements?: CompletedAchievement[]; // Updated type here
  allAchievements: AchievementWithTSRG[]; // Now receives all achievements
  preferences: UserPreferences; // Now receives preferences as a prop
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>; // Add setPreferences prop
}

export function AchievementTablePaginated({ 
  characterId, 
  completedAchievements = [],
  allAchievements = [],
  preferences, // Use preferences prop
  setPreferences // Use setPreferences prop
}: AchievementTablePaginatedProps) {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGINATION.DEFAULT_PAGE_SIZE); // Explicitly set type to number
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Get filter parameters from URL
  const categoryFilter = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("query") || "";
  
  // Apply filters and sorting to get filtered achievements
  const filteredAchievements = useMemo(() => {
    let filtered = [...allAchievements];
    
    // Apply TSR-G filters using preferences
    filtered = filtered.filter(achievement => {
      const { tsrg } = achievement;
      
      // Check TSR-G vector limits
      if (tsrg.time > preferences.maxTimeScore) return false;
      if (tsrg.skill > preferences.maxSkillScore) return false;
      if (tsrg.rng > preferences.maxRngScore) return false;
      if (tsrg.group > preferences.maxGroupScore) return false;
      
      // Check tier selection
      if (preferences.selectedTiers && !preferences.selectedTiers.includes(tsrg.tier)) return false;
      
      return true;
    });
    
    // Apply completion filter
    if (preferences.hideCompleted) {
      filtered = filtered.filter(achievement => !achievement.isCompleted);
    }
    
    // Apply obtainable filter
    if (preferences.hideUnobtainable) {
      filtered = filtered.filter(achievement => achievement.isObtainable);
    }
    
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

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        let valA: any;
        let valB: any;

        switch (sortColumn) {
          case 'name':
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
            break;
          case 'category':
            valA = a.category.toLowerCase();
            valB = b.category.toLowerCase();
            break;
          case 'points':
            valA = a.points;
            valB = b.points;
            break;
          case 'tsrgComposite':
            valA = a.tsrg.composite;
            valB = b.tsrg.composite;
            break;
          default:
            return 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [allAchievements, preferences, categoryFilter, searchQuery, sortColumn, sortDirection]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredAchievements.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageAchievements = filteredAchievements.slice(startIndex, endIndex);

  // Reset to page 1 when filters or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [preferences, categoryFilter, searchQuery, pageSize, sortColumn, sortDirection]);

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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scroll to top of table
      document.querySelector('[data-testid="achievements-table"]')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1);
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  if (allAchievements.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-white">Loading achievements...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <AchievementStats {...stats} />

      {/* Pagination Controls - Top */}
      <AchievementTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalResults={filteredAchievements.length}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        startIndex={startIndex}
        endIndex={endIndex}
      />
      
      {/* Achievement Table */}
      <AchievementTableContent
        achievements={currentPageAchievements}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      {/* Pagination Controls - Bottom */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <AchievementTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalResults={filteredAchievements.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        </div>
      )}
    </div>
  );
}