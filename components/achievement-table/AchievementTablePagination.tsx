"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGINATION } from "@/lib/constants";

interface AchievementTablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalResults: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: string) => void;
  startIndex: number;
  endIndex: number;
}

export function AchievementTablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalResults,
  onPageChange,
  onPageSizeChange,
  startIndex,
  endIndex,
}: AchievementTablePaginationProps) {
  if (totalResults === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 compass-card p-4">
      <div className="flex items-center gap-4">
        <div className="text-sm text-compass-300">
          Showing {startIndex + 1}-{Math.min(endIndex, totalResults)} of {totalResults} results
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-compass-300">Show:</span>
          <Select value={pageSize.toString()} onValueChange={onPageSizeChange}>
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
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="border-compass-600 text-compass-300 hover:bg-compass-700"
        >
          First
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
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
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="border-compass-600 text-compass-300 hover:bg-compass-700"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="border-compass-600 text-compass-300 hover:bg-compass-700"
        >
          Last
        </Button>
      </div>
    </div>
  );
}