"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, RefreshCw, TrendingUp, Clock, Zap, Dice6, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { calculateTSRGScore, getTierName, getTierColor, type AchievementWithTSRG } from "@/lib/tsrg-matrix";
import { type UserPreferences } from "@/lib/recommendations"; // Import UserPreferences
import { DEFAULT_PREFERENCES, PAGINATION } from "@/lib/constants"; // Import from constants

interface AchievementTablePaginatedProps {
  characterId: string;
  completedAchievements?: Array<{ id: number; completionDate: string }>;
  allAchievements: AchievementWithTSRG[]; // Now receives all achievements
  preferences: UserPreferences; // Now receives preferences as a prop
}

// Format date without external dependency
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}

export function AchievementTablePaginated({ 
  characterId, 
  completedAchievements = [],
  allAchievements = [],
  preferences // Use preferences prop
}: AchievementTablePaginatedProps) {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGINATION.DEFAULT_PAGE_SIZE);
  
  // Get filter parameters from URL
  const categoryFilter = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("query") || "";
  
  // Apply filters to get filtered achievements
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
      
      // Check tier selection (preferences.selectedTiers is not used in current preferences type,
      // assuming it's handled by max scores or will be added)
      // For now, if selectedTiers is part of preferences, it should be used here.
      // Assuming preferences.selectedTiers is an array of numbers, similar to TSRGFilters
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
    
    return filtered;
  }, [allAchievements, preferences, categoryFilter, searchQuery]); // Depend on preferences
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredAchievements.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageAchievements = filteredAchievements.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [preferences, categoryFilter, searchQuery, pageSize]);

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

  if (allAchievements.length === 0) {
    return (
      <div className="space-y-6">
        {/* TSRGFiltersComponent is now rendered in parent */}
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
            <TrendingUp className="h-4 w-4 text-gold-400" />
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

      {/* TSR-G Filters - REMOVED from here, now in ClientAchievementsPage */}

      {/* Pagination Controls - Top */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 compass-card p-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-compass-300">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAchievements.length)} of {filteredAchievements.length} results
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-compass-300">Show:</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20 bg-compass-800 border-compass-600 text-compass-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-compass-800 border-compass-600 text-compass-100">
                {PAGINATION.PAGE_SIZE_OPTIONS.map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="border-compass-600 text-compass-300 hover:bg-compass-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {/* Show page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 p-0 ${
                    currentPage === pageNum 
                      ? "bg-compass-600 hover:bg-compass-700" 
                      : "border-compass-600 text-compass-300 hover:bg-compass-700"
                  }`}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="border-compass-600 text-compass-300 hover:bg-compass-700"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Achievement Table */}
      <div className="rounded-md border border-compass-700 overflow-hidden" data-testid="achievements-table">
        <Table>
          <TableHeader>
            <TableRow className="bg-compass-800 hover:bg-compass-800 border-compass-700">
              <TableHead className="text-compass-100 w-12">Icon</TableHead>
              <TableHead className="text-compass-100">Achievement</TableHead>
              <TableHead className="text-compass-100">Category</TableHead>
              <TableHead className="text-compass-100">TSR-G Scores</TableHead>
              <TableHead className="text-compass-100">Tier</TableHead>
              <TableHead className="text-compass-100">Points</TableHead>
              <TableHead className="text-compass-100">Status</TableHead>
              <TableHead className="text-compass-100">Completion Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody data-testid="achievements-table-body">
            {currentPageAchievements.length > 0 ? (
              currentPageAchievements.map((achievement) => (
                <TableRow 
                  key={achievement.id} 
                  className={`
                    border-compass-700 transition-colors
                    ${achievement.isCompleted 
                      ? 'bg-gradient-to-r from-gold-900/20 to-compass-900/20 hover:from-gold-800/30 hover:to-compass-800/30 border-l-4 border-l-gold-500' 
                      : 'hover:bg-compass-800/50'
                    }
                  `}
                  data-testid={`achievement-row-${achievement.id}`}
                >
                  <TableCell className="p-2">
                    <div className="relative">
                      <AchievementIcon
                        icon={getAchievementIconUrl(achievement.icon)}
                        name={achievement.name}
                        size="sm"
                      />
                      {achievement.isCompleted && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 text-compass-900" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className={`font-medium ${achievement.isCompleted ? 'text-gold-200' : 'text-compass-100'}`}>
                        {achievement.name}
                        {achievement.isCompleted && (
                          <CheckCircle className="inline-block ml-2 h-4 w-4 text-gold-400" />
                        )}
                      </div>
                      <div className="text-sm text-compass-400 max-w-md truncate">
                        {achievement.description}
                      </div>
                      {achievement.rarity && achievement.rarity < 10 && (
                        <Badge variant="outline" className="mt-1 text-xs bg-purple-900/50 border-purple-700 text-purple-300">
                          Rare ({achievement.rarity.toFixed(1)}%)
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-compass-700/50 text-compass-300 border-compass-600">
                      {achievement.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gold-400" />
                        <span className="text-xs text-compass-100">{achievement.tsrg.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-compass-400" />
                        <span className="text-xs text-compass-100">{achievement.tsrg.skill}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Dice6 className="h-3 w-3 text-earth-400" />
                        <span className="text-xs text-compass-100">{achievement.tsrg.rng}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-silver-400" />
                        <span className="text-xs text-compass-100">{achievement.tsrg.group}</span>
                      </div>
                    </div>
                    <div className="text-xs text-compass-400 mt-1">
                      Total: {achievement.tsrg.composite}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getTierColor(achievement.tsrg.tier)} text-white`}>
                      {getTierName(achievement.tsrg.tier)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-compass-100">{achievement.points}</TableCell>
                  <TableCell>
                    {!achievement.isObtainable ? (
                      <Badge variant="outline" className="bg-compass-600/50 text-compass-300">
                        Unobtainable
                      </Badge>
                    ) : achievement.isCompleted ? (
                      <Badge className="bg-gold-600 hover:bg-gold-700 text-compass-900">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-compass-500 text-compass-300">
                        Incomplete
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-compass-300">
                    {achievement.completionDate
                      ? formatDate(achievement.completionDate)
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-compass-400" data-testid="no-achievements-message">
                  No achievements found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls - Bottom */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="border-compass-600 text-compass-300 hover:bg-compass-700"
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-compass-600 text-compass-300 hover:bg-compass-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm text-compass-300 px-4">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-compass-600 text-compass-300 hover:bg-compass-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="border-compass-600 text-compass-300 hover:bg-compass-700"
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}