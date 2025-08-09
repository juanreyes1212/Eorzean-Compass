"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, RefreshCw, TrendingUp, Clock, Zap, Dice6, Users, CheckCircle } from 'lucide-react';
import { calculateTSRGScore, getTierName, getTierColor, type AchievementWithTSRG } from "@/lib/tsrg-matrix";
import { TSRGFiltersComponent, type TSRGFilters } from "@/components/tsrg-filters";
import { AchievementIcon, getAchievementIconUrl } from "@/components/achievement-icon";

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  points: number;
  patch: string;
  isObtainable: boolean;
  isCompleted: boolean;
  completionDate: string | null;
  rarity?: number;
  icon?: string;
}

// Generate mock achievements with TSR-G scores and icons
function generateMockAchievementsWithTSRG(characterId: string): AchievementWithTSRG[] {
  const categories = ["Battle", "Character", "Items", "Crafting & Gathering", "Quests", "Exploration", "PvP", "Grand Company"];
  const achievements: AchievementWithTSRG[] = [];
  
  // Generate 100 mock achievements with varied TSR-G scores and icons
  for (let i = 1; i <= 100; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const isCompleted = Math.random() > 0.6; // 40% chance of being completed
    const isObtainable = category !== "Legacy" && Math.random() > 0.1;
    
    const completionDate = isCompleted
      ? new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      : null;
    
    const iconVariant = String(i).padStart(6, '0');
    const iconPath = `/i/061000/061${iconVariant.slice(-3)}.png`;
    
    const baseAchievement = {
      id: i,
      name: `Achievement ${i}`,
      description: `This is a description for achievement ${i}. It's a ${category.toLowerCase()} achievement.`,
      category,
      points: Math.floor(Math.random() * 15) * 5,
      patch: `${Math.floor(Math.random() * 6) + 1}.${Math.floor(Math.random() * 5)}`,
      isObtainable,
      isCompleted,
      completionDate,
      rarity: Math.random() * 100,
      icon: iconPath,
    };

    const tsrg = calculateTSRGScore(baseAchievement);
    
    achievements.push({
      ...baseAchievement,
      tsrg,
    });
  }
  
  return achievements;
}

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

interface AchievementTableEnhancedProps {
  characterId: string;
  completedAchievements?: Array<{ id: number; completionDate: string }>;
  allAchievements?: AchievementWithTSRG[];
}

const DEFAULT_FILTERS: TSRGFilters = {
  maxTime: 10,
  maxSkill: 10,
  maxRng: 10,
  maxGroup: 10,
  hideCompleted: false,
  hideUnobtainable: true,
  selectedTiers: [1, 2, 3, 4],
};

export function AchievementTableEnhanced({ 
  characterId, 
  completedAchievements = [],
  allAchievements = []
}: AchievementTableEnhancedProps) {
  const searchParams = useSearchParams();
  const [achievements, setAchievements] = useState<AchievementWithTSRG[]>([]);
  const [filters, setFilters] = useState<TSRGFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get filter parameters from URL
  const categoryFilter = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("query") || "";
  
  // Optimized filtering with useMemo and debouncing
  const filteredAchievements = useMemo(() => {
    let filtered = [...achievements];
    
    // Apply TSR-G filters first (most selective)
    filtered = filtered.filter(achievement => {
      const { tsrg } = achievement;
      
      // Quick early returns for performance
      if (tsrg.time > filters.maxTime) return false;
      if (tsrg.skill > filters.maxSkill) return false;
      if (tsrg.rng > filters.maxRng) return false;
      if (tsrg.group > filters.maxGroup) return false;
      if (!filters.selectedTiers.includes(tsrg.tier)) return false;
      
      return true;
    });
    
    // Apply completion filter
    if (filters.hideCompleted) {
      filtered = filtered.filter(achievement => !achievement.isCompleted);
    }
    
    // Apply obtainable filter
    if (filters.hideUnobtainable) {
      filtered = filtered.filter(achievement => achievement.isObtainable);
    }
    
    // Filter by category
    if (categoryFilter !== "all") {
      const categoryLower = categoryFilter.toLowerCase();
      filtered = filtered.filter(achievement => 
        achievement.category.toLowerCase().includes(categoryLower)
      );
    }
    
    // Filter by search query (most expensive, do last)
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      filtered = filtered.filter(achievement =>
        achievement.name.toLowerCase().includes(queryLower) ||
        achievement.description.toLowerCase().includes(queryLower)
      );
    }
    
    return filtered;
  }, [achievements, filters, categoryFilter, searchQuery]);

  // Fetch achievements with retry logic
  const fetchAchievements = async (isRetry = false) => {
    try {
      setLoading(true);
      if (!isRetry) {
        setError(null);
      }
      
      if (allAchievements.length > 0) {
        setAchievements(allAchievements);
      } else {
        const mockAchievements = generateMockAchievementsWithTSRG(characterId);
        setAchievements(mockAchievements);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error loading achievements:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to load achievements: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAchievements();
  }, [characterId, completedAchievements, allAchievements]);

  const handleRetry = () => {
    fetchAchievements(true);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = achievements.length;
    const completed = achievements.filter(a => a.isCompleted).length;
    const obtainable = achievements.filter(a => a.isObtainable).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const tierCounts = achievements.reduce((acc, achievement) => {
      acc[achievement.tsrg.tier] = (acc[achievement.tsrg.tier] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      total,
      completed,
      obtainable,
      completionRate,
      tierCounts,
      filtered: filteredAchievements.length,
    };
  }, [achievements, filteredAchievements]);

  if (loading && achievements.length === 0) {
    return (
      <div className="space-y-6">
        <TSRGFiltersComponent filters={filters} onFiltersChange={setFilters} />
        <div className="flex items-center justify-center py-8" data-testid="loading-state">
          <div className="text-white">Loading achievements with TSR-G analysis...</div>
        </div>
      </div>
    );
  }

  if (error && achievements.length === 0) {
    return (
      <div className="space-y-6">
        <TSRGFiltersComponent filters={filters} onFiltersChange={setFilters} />
        <div className="space-y-4" data-testid="error-state">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button onClick={handleRetry} variant="outline" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="compass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-gold-400" />
            <span className="text-sm text-compass-300">Completion Rate</span>
          </div>
          <div className="text-2xl font-bold text-compass-100">{stats.completionRate}%</div>
          <Progress value={stats.completionRate} className="mt-2 h-2" />
        </div>
        
        <div className="compass-card p-4">
          <div className="text-sm text-compass-300 mb-2">Completed</div>
          <div className="text-2xl font-bold text-compass-100">{stats.completed}</div>
          <div className="text-xs text-compass-400">of {stats.total} total</div>
        </div>
        
        <div className="compass-card p-4">
          <div className="text-sm text-compass-300 mb-2">Obtainable</div>
          <div className="text-2xl font-bold text-compass-100">{stats.obtainable}</div>
          <div className="text-xs text-compass-400">achievements available</div>
        </div>
        
        <div className="compass-card p-4">
          <div className="text-sm text-compass-300 mb-2">Filtered Results</div>
          <div className="text-2xl font-bold text-compass-100">{stats.filtered}</div>
          <div className="text-xs text-compass-400">matching criteria</div>
        </div>
      </div>

      {/* TSR-G Filters */}
      <TSRGFiltersComponent filters={filters} onFiltersChange={setFilters} />

      {error && achievements.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error} (Showing cached data)
            <Button onClick={handleRetry} variant="ghost" size="sm" className="ml-2">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="rounded-md border border-compass-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-compass-800 hover:bg-compass-800 border-compass-700">
              <TableHead className="text-compass-100 w-12">Icon</TableHead>
              <TableHead className="text-compass-100">Achievement</TableHead>
              <TableHead className="text-compass-100">Category</TableHead>
              <TableHead className="text-compass-100">TSR-G Scores</TableHead>
              <TableHead className="text-compass-100">Tier</TableHead>
              <TableHead className="text-compass-100">Points</TableHead>
              <TableHead className="text-compass-100">Status</TableHead>
              <TableHead className="text-compass-100">Completion Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody data-testid="achievements-table-body">
            {filteredAchievements.length > 0 ? (
              filteredAchievements.map((achievement) => (
                <TableRow 
                  key={achievement.id} 
                  className={`
                    border-compass-700 transition-colors
                    ${achievement.isCompleted 
                      ? 'bg-gradient-to-r from-gold-900/20 to-compass-900/20 hover:from-gold-800/30 hover:to-compass-800/30 border-l-4 border-l-gold-500' 
                      : 'hover:bg-compass-800/50'
                    }
                  `}
                  data-testid={`achievement-row-${achievement.id}`}
                >
                  <TableCell className="p-2">
                    <div className="relative">
                      <AchievementIcon
                        icon={getAchievementIconUrl(achievement.icon)}
                        name={achievement.name}
                        size="sm"
                      />
                      {achievement.isCompleted && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 text-compass-900" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className={`font-medium ${achievement.isCompleted ? 'text-gold-200' : 'text-compass-100'}`}>
                        {achievement.name}
                        {achievement.isCompleted && (
                          <CheckCircle className="inline-block ml-2 h-4 w-4 text-gold-400" />
                        )}
                      </div>
                      <div className="text-sm text-compass-400 max-w-md truncate">
                        {achievement.description}
                      </div>
                      {achievement.rarity && achievement.rarity < 10 && (
                        <Badge variant="outline" className="mt-1 text-xs bg-purple-900/50 border-purple-700 text-purple-300">
                          Rare ({achievement.rarity.toFixed(1)}%)
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-compass-700/50 text-compass-300 border-compass-600">
                      {achievement.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gold-400" />
                        <span className="text-xs text-compass-100">{achievement.tsrg.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-compass-400" />
                        <span className="text-xs text-compass-100">{achievement.tsrg.skill}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Dice6 className="h-3 w-3 text-earth-400" />
                        <span className="text-xs text-compass-100">{achievement.tsrg.rng}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-silver-400" />
                        <span className="text-xs text-compass-100">{achievement.tsrg.group}</span>
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
                  <TableCell className="text-compass-100">{achievement.points}</TableCell>
                  <TableCell>
                    {!achievement.isObtainable ? (
                      <Badge variant="outline" className="bg-compass-600/50 text-compass-300">
                        Unobtainable
                      </Badge>
                    ) : achievement.isCompleted ? (
                      <Badge className="bg-gold-600 hover:bg-gold-700 text-compass-900">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-compass-500 text-compass-300">
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
    </div>
  );
}
