"use client";

import { CharacterProfile } from "@/components/character-profile";
import { Button } from "@/components/ui/button";
import { Database, HardDrive, RefreshCw, Clock } from 'lucide-react'; // Import Clock icon
import { Character, CompletedAchievement } from "@/lib/types"; // Import CompletedAchievement

interface AchievementsPageHeaderProps {
  characterData: {
    character: Character;
    completedAchievements: CompletedAchievement[]; // Updated type here
    _isMockData?: boolean;
    _isRealData?: boolean;
    _error?: string;
  };
  actualStats: {
    total: number;
    completed: number;
    obtainable: number;
    completionRate: number;
  } | null;
  achievementsLoading: boolean;
  storageInfo: {
    used: number;
    available: number;
    characters: number;
    hasAchievements: boolean;
    hasPreferences: boolean;
  };
  onRefreshData: () => void; // New prop for refreshing data
}

export function AchievementsPageHeader({
  characterData,
  actualStats,
  achievementsLoading,
  storageInfo,
  onRefreshData, // Destructure new prop
}: AchievementsPageHeaderProps) {
  // Format date without external dependency
  const formatLastUpdated = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  return (
    <>
      {/* Storage Info and Refresh Button */}
      <div className="mb-6 text-xs text-compass-400 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1">
          <Database className="h-3 w-3" />
          <span>Storage: {Math.round(storageInfo.used / 1024)}KB used</span>
        </div>
        <div>{storageInfo.characters} characters cached</div>
        {storageInfo.hasAchievements && <div>Achievements cached</div>}
        
        {characterData.character.lastUpdated && (
          <div className="flex items-center gap-1 ml-0 sm:ml-auto">
            <Clock className="h-3 w-3" />
            <span>Last Updated: {formatLastUpdated(characterData.character.lastUpdated)}</span>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshData}
          className="border-compass-600 text-compass-300 hover:bg-compass-700 hover:text-compass-100 ml-auto sm:ml-0 transition-colors"
          disabled={achievementsLoading} // Disable while loading
          title={achievementsLoading ? "Loading..." : "Refresh character and achievement data"}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${achievementsLoading ? 'animate-spin' : ''}`} />
          {achievementsLoading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>
      
      {/* Character Profile with loading state and actual stats */}
      <CharacterProfile 
        character={characterData.character} 
        actualStats={actualStats}
        isLoading={achievementsLoading}
      />
      
      {/* Show data freshness indicator */}
      {!achievementsLoading && actualStats && (
        <div className="mt-4 text-xs text-compass-400 text-center">
          <span>Data loaded from FFXIVCollect • </span>
          <span>{actualStats.total} total achievements • </span>
          <span>{actualStats.completed} completed • </span>
          <span>{actualStats.completionRate}% completion rate</span>
        </div>
      )}
    </>
  );
}