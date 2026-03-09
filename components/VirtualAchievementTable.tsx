"use client";

import { useState, useRef } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableCell } from "@/components/ui/table";
import { AchievementTableRow } from "./achievement-table/AchievementTableRow";
import { ArrowUp, ArrowDown } from 'lucide-react';
import { AchievementWithTSRG, SortColumn, SortDirection } from "@/lib/types";
import { useVirtualScrolling } from "@/lib/utils/performance";

interface VirtualAchievementTableProps {
  achievements: AchievementWithTSRG[];
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  onAchievementClick: (achievement: AchievementWithTSRG) => void;
  containerHeight?: number;
}

const ITEM_HEIGHT = 80; // Approximate height of each table row

export function VirtualAchievementTable({
  achievements,
  sortColumn,
  sortDirection,
  onSort,
  onAchievementClick,
  containerHeight = 600,
}: VirtualAchievementTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  console.log(`[Virtual Table] Rendering with ${achievements.length} achievements, containerHeight: ${containerHeight}`);
  const { visibleItems, totalHeight, offsetY } = useVirtualScrolling(
    achievements,
    ITEM_HEIGHT,
    containerHeight
  );

  console.log(`[Virtual Table] Virtual scrolling: visibleItems=${visibleItems.length}, totalHeight=${totalHeight}, offsetY=${offsetY}`);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div className="rounded-md border border-compass-700 overflow-hidden" data-testid="achievements-table">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-compass-800">
          <TableRow className="bg-compass-800 hover:bg-compass-800 border-compass-700">
            <TableHead className="text-compass-100 w-12">Icon</TableHead>
            <TableHead 
              className="text-compass-100 cursor-pointer hover:text-gold-400 transition-colors"
              onClick={() => onSort('name')}
            >
              <div className="flex items-center gap-1">
                Achievement
                {sortColumn === 'name' && (
                  sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                )}
              </div>
            </TableHead>
            <TableHead 
              className="text-compass-100 cursor-pointer hover:text-gold-400 transition-colors"
              onClick={() => onSort('category')}
            >
              <div className="flex items-center gap-1">
                Category
                {sortColumn === 'category' && (
                  sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                )}
              </div>
            </TableHead>
            <TableHead 
              className="text-compass-100 cursor-pointer hover:text-gold-400 transition-colors"
              onClick={() => onSort('tsrgComposite')}
            >
              <div className="flex items-center gap-1">
                TSR-G Scores
                {sortColumn === 'tsrgComposite' && (
                  sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                )}
              </div>
            </TableHead>
            <TableHead className="text-compass-100">Tier</TableHead>
            <TableHead 
              className="text-compass-100 cursor-pointer hover:text-gold-400 transition-colors"
              onClick={() => onSort('points')}
            >
              <div className="flex items-center gap-1">
                Points
                {sortColumn === 'points' && (
                  sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                )}
              </div>
            </TableHead>
            <TableHead className="text-compass-100">Status</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
      
      <div 
        ref={containerRef}
        className="overflow-auto custom-scrollbar"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            <Table>
              <TableBody data-testid="achievements-table-body">
                {visibleItems.length > 0 ? (
                  visibleItems.map((achievement) => (
                    <AchievementTableRow 
                      key={achievement.id} 
                      achievement={achievement} 
                      onClick={() => onAchievementClick(achievement)}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-compass-400">
                      No achievements found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}