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
import { TSRGFiltersComponent, type TSRGFilters } from "@/components/tsrg-filters";
import { AchievementIcon, getAchievementIconUrl } from "@/components/achievement-icon";

interface AchievementTablePaginatedProps {
  characterId: string;
  completedAchievements?: Array<{ id: number; completionDate: string }>;
  allAchievements?: AchievementWithTSRG[];
}

const DEFAULT_FILTERS: TSRGFilters = {
  maxTime: 10,
  maxSkill: 10,
  maxRng: 10,
  maxGroup: 10,
  hideCompleted: false,
  hideUnobtainable: true,
  selectedTiers: [1, 2, 3, 4],
};

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];
const DEFAULT_PAGE_SIZE = 50;

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
  allAchievements = []
}: AchievementTablePaginatedProps) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<TSRGFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  
  // Get filter parameters from URL
  const categoryFilter = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("query") || "";
  
  // Apply filters to get filtered achievements
  const filteredAchievements = useMemo(() => {
    let filtered = [...allAchievements];
    
    // Apply TSR-G filters
    filtered = filtered.filter(achievement => {
      const { tsrg } = achievement;
      
      // Check TSR-G vector limits
      if (tsrg.time > filters.maxTime) return false;
      if (tsrg.skill > filters.maxSkill) return false;
      if (tsrg.rng > filters.maxRng) return false;
      if (tsrg.group > filters.maxGroup) return false;
      
      // Check tier selection
      if (!filters.selectedTiers.includes(tsrg.tier)) return false;
      
      return true;
    });
    
    // Apply completion filter
    if (filters.hideCompleted) {
      filtered = filtered.filter(achievement => !achievement.isCompleted);
    }
    
    // Apply obtainable filter
    if (filters.hideUnobtainable) {
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
  }, [allAchievements, filters, categoryFilter, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAchievements.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageAchievements = filteredAchievements.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, categoryFilter, searchQuery, pageSize]);

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
        <TSRGFiltersComponent filters={filters} onFiltersChange={setFilters} />
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
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-sm text-slate-300">Completion Rate</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.completionRate}%</div>
          <Progress value={stats.completionRate} className="mt-2 h-2" />
        </div>
        
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-sm text-slate-300 mb-2">Completed</div>
          <div className="text-2xl font-bold text-white">{stats.completed}</div>
          <div className="text-xs text-slate-400">of {stats.total} total</div>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-sm text-slate-300 mb-2">Obtainable</div>
          <div className="text-2xl font-bold text-white">{stats.obtainable}</div>
          <div className="text-xs text-slate-400">achievements available</div>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-sm text-slate-300 mb-2">Filtered Results</div>
          <div className="text-2xl font-bold text-white">{stats.filtered}</div>
          <div className="text-xs text-slate-400">matching criteria</div>
        </div>
      </div>

      {/* TSR-G Filters */}
      <TSRGFiltersComponent filters={filters} onFiltersChange={setFilters} />

      {/* Pagination Controls - Top */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-300">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAchievements.length)} of {filteredAchievements.length} results
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-300">Show:</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20 bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600 text-white">
                {PAGE_SIZE_OPTIONS.map(size => (
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
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
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
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "border-slate-600 text-slate-300 hover:bg-slate-700"
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
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Achievement Table */}
      <div className="rounded-md border border-slate-700 overflow-hidden" data-testid="achievements-table">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-700 hover:bg-slate-700">
              <TableHead className="text-white w-12">Icon</TableHead>
              <TableHead className="text-white">Achievement</TableHead>
              <TableHead className="text-white">Category</TableHead>
              <TableHead className="text-white">TSR-G Scores</TableHead>
              <TableHead className="text-white">Tier</TableHead>
              <TableHead className="text-white">Points</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Completion Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody data-testid="achievements-table-body">
            {currentPageAchievements.length > 0 ? (
              currentPageAchievements.map((achievement) => (
                <TableRow 
                  key={achievement.id} 
                  className="hover:bg-slate-700/50 border-slate-700"
                  data-testid={`achievement-row-${achievement.id}`}
                >
                  <TableCell className="p-2">
                    <AchievementIcon
                      icon={getAchievementIconUrl(achievement.icon)}
                      name={achievement.name}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">{achievement.name}</div>
                      <div className="text-sm text-slate-400 max-w-md truncate">
                        {achievement.description}
                      </div>
                      {achievement.rarity && achievement.rarity < 10 && (
                        <Badge variant="outline" className="mt-1 text-xs bg-purple-900 border-purple-700 text-purple-300">
                          Rare ({achievement.rarity.toFixed(1)}%)
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-700 text-slate-300 border-slate-600">
                      {achievement.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-orange-400" />
                        <span className="text-xs text-white">{achievement.tsrg.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-purple-400" />
                        <span className="text-xs text-white">{achievement.tsrg.skill}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Dice6 className="h-3 w-3 text-red-400" />
                        <span className="text-xs text-white">{achievement.tsrg.rng}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-blue-400" />
                        <span className="text-xs text-white">{achievement.tsrg.group}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Total: {achievement.tsrg.composite}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getTierColor(achievement.tsrg.tier)} text-white`}>
                      {getTierName(achievement.tsrg.tier)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white">{achievement.points}</TableCell>
                  <TableCell>
                    {!achievement.isObtainable ? (
                      <Badge variant="outline" className="bg-slate-600 text-slate-300">
                        Unobtainable
                      </Badge>
                    ) : achievement.isCompleted ? (
                      <Badge className="bg-green-600 hover:bg-green-700">Completed</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500 text-amber-500">
                        Incomplete
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {achievement.completionDate
                      ? formatDate(achievement.completionDate)
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-400">
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
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm text-slate-300 px-4">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
