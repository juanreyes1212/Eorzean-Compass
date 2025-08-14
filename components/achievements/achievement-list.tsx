"use client";

import { useMemo } from 'react';
import { AchievementCard } from './achievement-card';
import { AchievementTableView } from './achievement-table-view';
import { Button } from '@/components/ui/button';
import { Grid, List } from 'lucide-react';
import { useFilters } from '@/lib/hooks/useFilters';
import type { AchievementWithTSRG } from '@/lib/tsrg-matrix';

interface AchievementListProps {
  achievements: AchievementWithTSRG[];
  viewMode?: 'grid' | 'table';
  onViewModeChange?: (mode: 'grid' | 'table') => void;
  onAchievementClick?: (achievement: AchievementWithTSRG) => void;
}

export function AchievementList({
  achievements,
  viewMode = 'table',
  onViewModeChange,
  onAchievementClick,
}: AchievementListProps) {
  const { applyFilters } = useFilters();

  const filteredAchievements = useMemo(() => {
    return applyFilters(achievements);
  }, [achievements, applyFilters]);

  if (achievements.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-compass-400 mb-2">No achievements loaded</div>
          <div className="text-sm text-compass-500">Please wait while we fetch achievement data</div>
        </div>
      </div>
    );
  }

  if (filteredAchievements.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-compass-400 mb-2">No achievements match your filters</div>
          <div className="text-sm text-compass-500">Try adjusting your TSR-G criteria or search terms</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      {onViewModeChange && (
        <div className="flex justify-end">
          <div className="flex rounded-lg border border-compass-600 bg-compass-800">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('table')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="rounded-l-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Achievement Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              onClick={() => onAchievementClick?.(achievement)}
            />
          ))}
        </div>
      ) : (
        <AchievementTableView
          achievements={filteredAchievements}
          onAchievementClick={onAchievementClick}
        />
      )}

      {/* Results Summary */}
      <div className="text-center text-sm text-compass-400">
        Showing {filteredAchievements.length} of {achievements.length} achievements
      </div>
    </div>
  );
}