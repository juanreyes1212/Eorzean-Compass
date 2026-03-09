"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AchievementStats } from "./achievement-table/AchievementStats";
import { AchievementTableContent } from "./achievement-table/AchievementTableContent";
import { AchievementTablePagination } from "./achievement-table/AchievementTablePagination";
import { AchievementWithTSRG, UserPreferences, SortColumn, SortDirection, CompletedAchievement } from "@/lib/types";
import { PAGINATION } from "@/lib/constants";

interface AchievementTablePaginatedProps {
  characterId: string;
  completedAchievements?: CompletedAchievement[];
  allAchievements: AchievementWithTSRG[];
  preferences: UserPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
  onAchievementClick: (achievement: AchievementWithTSRG) => void;
}

export function AchievementTablePaginated({
  characterId,
  completedAchievements = [],
  allAchievements = [],
  preferences,
  setPreferences,
  onAchievementClick,
}: AchievementTablePaginatedProps) {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGINATION.DEFAULT_PAGE_SIZE);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const categoryFilter = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("query") || "";

  const filteredAchievements = useMemo(() => {
    let filtered = [...allAchievements];

    filtered = filtered.filter(achievement => {
      const { tsrg } = achievement;
      if (tsrg.time > preferences.maxTimeScore) return false;
      if (tsrg.skill > preferences.maxSkillScore) return false;
      if (tsrg.rng > preferences.maxRngScore) return false;
      if (tsrg.group > preferences.maxGroupScore) return false;
      if (preferences.selectedTiers && !preferences.selectedTiers.includes(tsrg.tier)) return false;
      return true;
    });

    if (preferences.hideCompleted) {
      filtered = filtered.filter(achievement => !achievement.isCompleted);
    }

    if (preferences.hideUnobtainable) {
      filtered = filtered.filter(achievement => achievement.isObtainable);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (achievement) => achievement.category.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (achievement) =>
          achievement.name.toLowerCase().includes(query) ||
          achievement.description.toLowerCase().includes(query)
      );
    }

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

  const totalPages = Math.ceil(filteredAchievements.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageAchievements = filteredAchievements.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [preferences, categoryFilter, searchQuery, pageSize, sortColumn, sortDirection]);

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
      <AchievementStats {...stats} />

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

      <AchievementTableContent
        achievements={currentPageAchievements}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        onAchievementClick={onAchievementClick}
      />

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
