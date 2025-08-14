"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Clock, Zap, Dice6, Users } from 'lucide-react';
import { AchievementIcon, getAchievementIconUrl } from "@/components/achievement-icon";
import { getTierName, getTierColor, type AchievementWithTSRG } from "@/lib/tsrg-matrix";

interface AchievementTableViewProps {
  achievements: AchievementWithTSRG[];
  onAchievementClick?: (achievement: AchievementWithTSRG) => void;
  pageSize?: number;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

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

export function AchievementTableView({ 
  achievements, 
  onAchievementClick,
  pageSize: initialPageSize = 50 
}: AchievementTableViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Calculate pagination
  const totalPages = Math.ceil(achievements.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageAchievements = achievements.slice(startIndex, endIndex);

  // Reset to page 1 when achievements change
  useMemo(() => {
    setCurrentPage(1);
  }, [achievements]);

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

  if (achievements.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-compass-400">No achievements to display</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pagination Controls - Top */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-compass-800 rounded-lg p-4 border border-compass-700">
        <div className="flex items-center gap-4">
          <div className="text-sm text-compass-300">
            Showing {startIndex + 1}-{Math.min(endIndex, achievements.length)} of {achievements.length} results
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-compass-300">Show:</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20 bg-compass-700 border-compass-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-compass-700 border-compass-600 text-white">
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
            className="border-compass-600 text-compass-300 hover:bg-compass-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
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
                      ? "bg-gold-600 hover:bg-gold-700" 
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
            <TableRow className="bg-compass-700 hover:bg-compass-700">
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
            {currentPageAchievements.map((achievement) => (
              <TableRow 
                key={achievement.id} 
                className="hover:bg-compass-700/50 border-compass-700 cursor-pointer"
                data-testid={`achievement-row-${achievement.id}`}
                onClick={() => onAchievementClick?.(achievement)}
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
                    <div className="text-sm text-compass-400 max-w-md truncate">
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
                  <Badge variant="outline" className="bg-compass-700 text-compass-300 border-compass-600">
                    {achievement.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gold-400" />
                      <span className="text-xs text-white">{achievement.tsrg.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-compass-400" />
                      <span className="text-xs text-white">{achievement.tsrg.skill}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Dice6 className="h-3 w-3 text-earth-400" />
                      <span className="text-xs text-white">{achievement.tsrg.rng}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-silver-400" />
                      <span className="text-xs text-white">{achievement.tsrg.group}</span>
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
                <TableCell className="text-white">{achievement.points}</TableCell>
                <TableCell>
                  {!achievement.isObtainable ? (
                    <Badge variant="outline" className="bg-compass-600 text-compass-300">
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
                <TableCell className="text-compass-300">
                  {achievement.completionDate
                    ? formatDate(achievement.completionDate)
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
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