"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AchievementTableRow } from "./AchievementTableRow";
import { ArrowUp, ArrowDown } from 'lucide-react';
import { AchievementWithTSRG, SortColumn, SortDirection } from "@/lib/types"; // Import from types

interface AchievementTableContentProps {
  achievements: AchievementWithTSRG[];
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  onAchievementClick: (achievement: AchievementWithTSRG) => void; // New prop
}

export function AchievementTableContent({
  achievements,
  sortColumn,
  sortDirection,
  onSort,
  onAchievementClick, // Destructure new prop
}: AchievementTableContentProps) {
  return (
    <div className="rounded-md border border-compass-700 overflow-hidden" data-testid="achievements-table">
      <Table>
        <TableHeader>
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
            {/* Removed Completion Date TableHead */}
          </TableRow>
        </TableHeader>
        <TableBody data-testid="achievements-table-body">
          {achievements.length > 0 ? (
            achievements.map((achievement, index) => {
              if (index < 5) { // Only log first 5 to avoid spam
                console.log(`[Table Content] Rendering ${index + 1}/${achievements.length}: ${achievement.name} (ID: ${achievement.id}, completed: ${achievement.isCompleted})`);
              }
              return (
              <AchievementTableRow 
                key={achievement.id} 
                achievement={achievement} 
                onClick={() => onAchievementClick(achievement)} // Pass click handler
              />
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-compass-400" data-testid="no-achievements-message">
                <div className="space-y-2">
                  <div>No achievements found matching your current filters.</div>
                  <div className="text-xs">Try adjusting your TSR-G settings, difficulty tiers, or search criteria.</div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}