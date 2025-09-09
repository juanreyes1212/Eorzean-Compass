"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"; // Import Dialog components
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip components
import { TrendingUp, Clock, Star, Target, Lightbulb, Trophy, Users, Zap, Dice6, ChevronRight, Info } from 'lucide-react';
import { 
  generateRecommendations, 
  generateAchievementProjects,
  analyzeUserSkillProfile,
} from "@/lib/recommendations";
import { getTierName, getTierColor } from "@/lib/tsrg-matrix";
import { AchievementIcon, getAchievementIconUrl } from "@/components/achievement-icon";
import { AchievementDetailsModal } from "./achievement-details-modal"; // Import the new modal
import { 
  AchievementRecommendation, 
  AchievementProject, 
  UserPreferences, 
  AchievementWithTSRG,
  CompletedAchievement // Import CompletedAchievement
} from "@/lib/types"; // Import types from centralized location

interface RecommendationsDashboardProps {
  allAchievements: AchievementWithTSRG[];
  completedAchievements: CompletedAchievement[]; // Updated type here
  preferences: UserPreferences;
  onAchievementClick?: (achievement: AchievementWithTSRG) => void;
}

export function RecommendationsDashboard({
  allAchievements,
  completedAchievements,
  preferences,
  onAchievementClick
}: RecommendationsDashboardProps) {
  const [selectedProject, setSelectedProject] = useState<AchievementProject | null>(null);
  const [selectedAchievementForDetails, setSelectedAchievementForDetails] = useState<AchievementWithTSRG | null>(null); // New state for details modal

  // Filter allAchievements to get only the ones that are actually completed and have TSRG data
  // This is used for user profile analysis and project completion calculation
  const completedAchievementsWithTSRG = useMemo(() => 
    allAchievements.filter(a => completedAchievements.some(ca => ca.id === a.id)),
    [allAchievements, completedAchievements]
  );

  // Generate recommendations and projects - always run these hooks
  const recommendations = useMemo(() => {
    if (allAchievements.length === 0) return [];
    return generateRecommendations(allAchievements, completedAchievements, preferences, 8);
  }, [allAchievements, completedAchievements, preferences]);

  const projects = useMemo(() => {
    if (allAchievements.length === 0) return [];
    const completedIds = new Set(completedAchievements.map(a => a.id));
    return generateAchievementProjects(allAchievements, completedIds);
  }, [allAchievements, completedAchievements]);

  const userProfile = useMemo(() => 
    analyzeUserSkillProfile(completedAchievementsWithTSRG), // Use the filtered list here
    [completedAchievementsWithTSRG]
  );

  // Get top incomplete projects
  const topProjects = useMemo(() => 
    projects.filter(p => !p.isCompleted).slice(0, 6),
    [projects]
  );

  // Add loading state check AFTER all hooks
  if (allAchievements.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-6 bg-slate-800 border-slate-700">
          <div className="flex items-center justify-center py-8">
            <div className="text-white">Loading recommendations...</div>
          </div>
        </Card>
      </div>
    );
  }

  const getReasonIcon = (type: string) => {
    switch (type) {
      case 'skill_match': return <Zap className="h-3 w-3" />;
      case 'time_efficient': return <Clock className="h-3 w-3" />;
      case 'category_preference': return <Target className="h-3 w-3" />;
      case 'rarity': return <Star className="h-3 w-3" />;
      case 'points_efficient': return <Trophy className="h-3 w-3" />;
      case 'similar_achievements': return <TrendingUp className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  };

  const getReasonColor = (type: string) => {
    switch (type) {
      case 'skill_match': return 'text-purple-400';
      case 'time_efficient': return 'text-green-400';
      case 'category_preference': return 'text-blue-400';
      case 'rarity': return 'text-yellow-400';
      case 'points_efficient': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  const getTierDescription = (tier: number) => {
    switch (tier) {
      case 1: return 'Foundational: Basic milestones and story progression achievements.';
      case 2: return 'Systematic: Regular engagement and moderate effort achievements.';
      case 3: return 'Dedicated: Significant time investment and focused effort.';
      case 4: return 'Apex: The most challenging achievements in the game.';
      default: return 'Unknown Tier.';
    }
  };

  return (
    <div className="space-y-6">
      {/* User Profile Summary */}
      <Card className="p-6 compass-card">
        <h3 className="text-lg font-semibold text-compass-100 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-gold-400" />
          Your Achievement Profile
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-compass-100">{userProfile.preferredDifficulty}</div>
            <div className="text-sm text-compass-300">Preferred Difficulty</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-compass-100">{userProfile.averageSkill}/10</div>
            <div className="text-sm text-compass-300">Average Skill Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-compass-100">{userProfile.averageTime}/10</div>
            <div className="text-sm text-compass-300">Time Investment</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-compass-100">{completedAchievements.length}</div>
            <div className="text-sm text-compass-300">Completed</div>
          </div>
        </div>

        {userProfile.strongestAreas.length > 0 && (
          <div>
            <div className="text-sm text-compass-300 mb-2">Your Strengths:</div>
            <div className="flex flex-wrap gap-2">
              {userProfile.strongestAreas.map((area) => (
                <Badge key={area} variant="outline" className="bg-compass-900 border-compass-700 text-compass-300">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-compass-800 border-compass-700">
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-compass-700 text-compass-100">
            Recommended For You
          </TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:bg-compass-700 text-compass-100">
            Achievement Projects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-gold-400" />
            <h3 className="text-lg font-semibold text-compass-100">Personalized Recommendations</h3>
          </div>

          {recommendations.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No recommendations available with your current filters. Try adjusting your TSR-G preferences.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <Card 
                  key={rec.achievement.id} 
                  className="p-4 compass-card hover:border-compass-600 hover:bg-compass-700/70 transition-colors cursor-pointer"
                  onClick={() => onAchievementClick?.(rec.achievement)}
                  data-testid="recommendation-card"
                >
                  <div className="flex gap-3 mb-3">
                    <AchievementIcon
                      icon={getAchievementIconUrl(rec.achievement.icon)}
                      name={rec.achievement.name}
                      size="md"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-compass-100 mb-1 truncate">{rec.achievement.name}</h4>
                      <p className="text-sm text-compass-400 line-clamp-2">{rec.achievement.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Badge className={`${getTierColor(rec.achievement.tsrg.tier)} text-white text-xs`}>
                        {getTierName(rec.achievement.tsrg.tier)}
                      </Badge>
                      <Badge variant="outline" className="bg-compass-700/50 text-compass-300 border-compass-600 text-xs">
                        {rec.achievement.points} Points
                      </Badge>
                      <div className="text-right">
                        <div className="text-xs text-compass-400">{rec.estimatedTimeToComplete}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gold-400" />
                      <span className="text-compass-100">{rec.achievement.tsrg.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-compass-400" />
                      <span className="text-compass-100">{rec.achievement.tsrg.skill}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Dice6 className="h-3 w-3 text-earth-400" />
                      <span className="text-compass-100">{rec.achievement.tsrg.rng}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-silver-400" />
                      <span className="text-compass-100">{rec.achievement.tsrg.group}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-compass-300 mb-1">Why recommended:</div>
                    {rec.reasons.slice(0, 2).map((reason, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs" data-testid="recommendation-reason">
                        <span className={getReasonColor(reason.type)}>
                          {getReasonIcon(reason.type)}
                        </span>
                        <span className="text-compass-300">{reason.description}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-gold-400" />
            <h3 className="text-lg font-semibold text-compass-100">Achievement Projects</h3>
          </div>

          {topProjects.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No active projects available. Complete more achievements to unlock project recommendations.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topProjects.map((project) => (
                <Card 
                  key={project.id} 
                  className="p-4 compass-card hover:border-compass-600 hover:bg-compass-700/70 transition-colors cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                  data-testid="project-card"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-compass-100 mb-1">{project.name}</h4>
                      <Badge variant="outline" className="bg-compass-700 text-compass-300 border-compass-600 text-xs">
                        {project.category}
                      </Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-compass-400" />
                  </div>

                  <p className="text-sm text-compass-400 mb-3 line-clamp-2">{project.description}</p>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-compass-300">Progress</span>
                      <span className="text-compass-100">{Math.round(project.completionRate)}%</span>
                    </div>
                    <Progress value={project.completionRate} className="h-2" />
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-4">
                      <span className="text-compass-300">{project.achievements.length} achievements</span>
                      <span className="text-compass-300">{project.totalPoints} points</span>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className={`${getTierColor(project.difficulty)} text-white text-xs cursor-help`}>
                            Tier {project.difficulty}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-compass-800 border-compass-600 text-compass-100 z-tooltip">
                          <p>{getTierDescription(project.difficulty)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="text-xs text-compass-400 mt-2">
                    Est. time: {project.estimatedTime}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

      </Tabs>

      {/* Project Detail Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="bg-compass-800 border-compass-700 p-6 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-compass-100">{selectedProject?.name}</DialogTitle>
            <DialogDescription className="text-compass-300">
              {selectedProject?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedProject && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-compass-100">{Math.round(selectedProject.completionRate)}%</div>
                  <div className="text-sm text-compass-300">Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-compass-100">{selectedProject.totalPoints}</div>
                  <div className="text-sm text-compass-300">Total Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-compass-100">{selectedProject.achievements.length}</div>
                  <div className="text-sm text-compass-300">Achievements</div>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                <h4 className="font-medium text-compass-100 mb-3">Achievements in this project:</h4>
                {selectedProject.achievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className="flex items-center gap-3 p-3 bg-compass-700 rounded-lg hover:bg-compass-600 cursor-pointer"
                    onClick={() => setSelectedAchievementForDetails(achievement)}
                  >
                    <AchievementIcon
                      icon={getAchievementIconUrl(achievement.icon)}
                      name={achievement.name}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-compass-100">{achievement.name}</div>
                      <div className="text-sm text-compass-400">{achievement.points} points</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {achievement.isCompleted ? (
                        <Badge className="bg-gold-600 text-compass-900">Completed</Badge>
                      ) : (
                        <Badge variant="outline" className="border-compass-500 text-compass-300">
                          Incomplete
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <DialogClose asChild>
            <Button variant="outline" className="mt-4 w-full border-compass-600 text-compass-100 hover:bg-compass-600">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Achievement Details Modal */}
      <AchievementDetailsModal 
        achievement={selectedAchievementForDetails}
        isOpen={!!selectedAchievementForDetails}
        onClose={() => setSelectedAchievementForDetails(null)}
      />
    </div>
  );
}