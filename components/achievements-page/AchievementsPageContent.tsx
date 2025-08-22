"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { RecommendationsDashboard } from "@/components/recommendations-dashboard";
import { TSRGFiltersComponent } from "@/components/tsrg-filters"; // Keep import for type
import { CategoryFilter } from "@/components/category-filter";
import { SearchFilter } from "@/components/search-filter";
import { AchievementTablePaginated } from "@/components/achievement-table-paginated";
import { AchievementWithTSRG, UserPreferences, CompletedAchievement } from "@/lib/types"; // Import CompletedAchievement

interface AchievementsPageContentProps {
  allAchievements: AchievementWithTSRG[];
  completedAchievementsWithTSRG: AchievementWithTSRG[];
  preferences: UserPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>; // Updated type here
  achievementsLoading: boolean;
  characterId: string;
  completedAchievements: CompletedAchievement[]; // Updated type here
  onAchievementClick: (achievement: AchievementWithTSRG) => void;
}

export function AchievementsPageContent({
  allAchievements,
  completedAchievementsWithTSRG,
  preferences,
  setPreferences,
  achievementsLoading,
  characterId,
  completedAchievements,
  onAchievementClick,
}: AchievementsPageContentProps) {
  return (
    <div className="mt-8">
      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-compass-800 border-compass-700 mb-6">
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-compass-700 text-compass-100">
            Recommendations & Projects
          </TabsTrigger>
          <TabsTrigger value="achievements" className="data-[state=active]:bg-compass-700 text-compass-100">
            Your Achievements ({completedAchievementsWithTSRG.length} unlocked out of {allAchievements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations">
          {achievementsLoading ? (
            <Card className="p-6 compass-card">
              <div className="flex items-center justify-center py-8">
                <div className="text-compass-100">Loading achievements and generating recommendations...</div>
              </div>
            </Card>
          ) : (
            <RecommendationsDashboard
              allAchievements={allAchievements}
              completedAchievements={completedAchievementsWithTSRG}
              preferences={preferences}
              onAchievementClick={onAchievementClick}
            />
          )}
        </TabsContent>

        <TabsContent value="achievements">
          <React.Fragment>
            <div className="compass-card p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-compass-100">Your Achievements with TSR-G Analysis</h2>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  <CategoryFilter />
                  <SearchFilter />
                </div>
              </div>
              
              {/* TSR-G Filters Component moved to ClientAchievementsPage */}

              {achievementsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-compass-100">Loading achievements...</div>
                </div>
              ) : (
                <AchievementTablePaginated 
                  characterId={characterId} 
                  completedAchievements={completedAchievements || []}
                  allAchievements={allAchievements}
                  preferences={preferences}
                  setPreferences={setPreferences}
                  onAchievementClick={onAchievementClick}
                />
              )}
            </div>
          </React.Fragment>
        </TabsContent>
      </Tabs>
    </div>
  );
}