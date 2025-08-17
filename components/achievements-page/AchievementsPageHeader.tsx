"use client";

import React from "react";
import { CharacterProfile } from "@/components/character-profile";
import { Database, HardDrive } from 'lucide-react';
import { Character, AchievementWithTSRG } from "@/lib/types";

interface AchievementsPageHeaderProps {
  characterData: {
    character: Character;
    completedAchievements: Array<{ id: number; completionDate: string }>;
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
}

export function AchievementsPageHeader({
  characterData,
  actualStats,
  achievementsLoading,
  storageInfo,
}: AchievementsPageHeaderProps) {
  return (
    <>
      {/* Storage Info */}
      <div className="mb-6 text-xs text-compass-400 flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Database className="h-3 w-3" />
          <span>Storage: {Math.round(storageInfo.used / 1024)}KB used</span>
        </div>
        <div>{storageInfo.characters} characters cached</div>
        {storageInfo.hasAchievements && <div>Achievements cached</div>}
      </div>
      
      {/* Character Profile with loading state and actual stats */}
      <CharacterProfile 
        character={characterData.character} 
        actualStats={actualStats}
        isLoading={achievementsLoading}
      />
    </>
  );
}