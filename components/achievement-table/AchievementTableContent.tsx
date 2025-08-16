"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AchievementTableRow } from "./AchievementTableRow";
import { ArrowUp, ArrowDown } from 'lucide-react';
import { AchievementWithTSRG } from "@/lib/types";

type SortColumn = 'name' | 'category' | 'points' | 'tsrgComposite' | null;
type SortDirection = 'asc' | 'desc';

interface AchievementTableContentProps {
  achievements: AchievementWithTSRG[];
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
}

export function AchievementTableContent({
  achievements,
  sortColumn,
  sortDirection,
  onSort,
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
            <TableHead className="text-compass-100">Completion Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody data-testid="achievements-table-body">
          {achievements.length > 0 ? (
            achievements.map((achievement) => (
              <AchievementTableRow key={achievement.id} achievement={achievement} />
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
  );
}