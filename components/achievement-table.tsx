"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from 'lucide-react';

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
}

// Generate mock achievements for the MVP
function generateMockAchievements(characterId: string): Achievement[] {
  const categories = ["Battle", "Character", "Items", "Crafting", "Gathering", "Quests", "Exploration", "PvP", "Grand Company", "Legacy"];
  const achievements: Achievement[] = [];
  
  // Generate 100 mock achievements
  for (let i = 1; i <= 100; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const isCompleted = Math.random() > 0.6; // 40% chance of being completed
    const isObtainable = category !== "Legacy" && Math.random() > 0.1; // Legacy achievements are not obtainable
    
    // Generate a random date in the past year for completed achievements
    const completionDate = isCompleted
      ? new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      : null;
    
    achievements.push({
      id: i,
      name: `Achievement ${i}`,
      description: `This is a description for achievement ${i}. It's a ${category.toLowerCase()} achievement.`,
      category,
      points: Math.floor(Math.random() * 15) * 5, // Points in multiples of 5, up to 70
      patch: `${Math.floor(Math.random() * 6) + 1}.${Math.floor(Math.random() * 5)}`,
      isObtainable,
      isCompleted,
      completionDate,
    });
  }
  
  return achievements;
}

// Format date without external dependency
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

interface AchievementTableProps {
  characterId: string;
  completedAchievements?: Array<{ id: number; completionDate: string }>;
}

export function AchievementTable({ 
  characterId, 
  completedAchievements = [] 
}: AchievementTableProps) {
  const searchParams = useSearchParams();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filteredAchievements, setFilteredAchievements] = useState<Achievement[]>([]);
  const [showUnobtainable, setShowUnobtainable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Get filter parameters from URL
  const categoryFilter = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("query") || "";
  
  // Fetch achievements with retry logic
  const fetchAchievements = async (isRetry = false) => {
    try {
      setLoading(true);
      if (!isRetry) {
        setError(null);
      }
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const achievementsResponse = await fetch('/api/achievements', {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!achievementsResponse.ok) {
        const errorData = await achievementsResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to fetch achievements (${achievementsResponse.status})`);
      }

      const masterAchievements = await achievementsResponse.json();

      if (!Array.isArray(masterAchievements)) {
        throw new Error('Invalid achievements data format');
      }

      // Create a map of completed achievements for quick lookup
      const completedMap = new Map(
        completedAchievements
          .filter(comp => comp.id && comp.completionDate) // Validate data
          .map(comp => [comp.id, comp.completionDate])
      );

      // Merge master achievements with completion status
      const achievementsWithStatus = masterAchievements.map((achievement: any) => ({
        ...achievement,
        isCompleted: completedMap.has(achievement.id),
        completionDate: completedMap.get(achievement.id) || null,
      }));

      setAchievements(achievementsWithStatus);
      setError(null);
      setRetryCount(0);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(`Failed to load achievements: ${errorMessage}`);
      }
      
      // If this is the first load and we have no data, show empty state
      if (achievements.length === 0) {
        setAchievements([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAchievements();
  }, [characterId, completedAchievements]);

  // Retry handler
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchAchievements(true);
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...achievements];
    
    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (achievement) => achievement.category.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (achievement) =>
          achievement.name.toLowerCase().includes(query) ||
          achievement.description.toLowerCase().includes(query)
      );
    }
    
    // Filter unobtainable achievements
    if (!showUnobtainable) {
      filtered = filtered.filter((achievement) => achievement.isObtainable);
    }
    
    setFilteredAchievements(filtered);
  }, [achievements, categoryFilter, searchQuery, showUnobtainable]);
  
  if (loading && achievements.length === 0) {
    return (
      <div className="flex items-center justify-center py-8" data-testid="loading-state">
        <div className="text-white">Loading achievements...</div>
      </div>
    );
  }

  if (error && achievements.length === 0) {
    return (
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
    );
  }
  
  return (
    <div>
      {error && achievements.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error} (Showing cached data)
            <Button onClick={handleRetry} variant="ghost" size="sm" className="ml-2">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center mb-4">
        <Checkbox
          id="show-unobtainable"
          checked={showUnobtainable}
          onCheckedChange={(checked) => setShowUnobtainable(!!checked)}
          data-testid="show-unobtainable-checkbox"
        />
        <label htmlFor="show-unobtainable" className="ml-2 text-sm text-slate-300">
          Show unobtainable achievements
        </label>
      </div>
      
      <div className="rounded-md border border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-700 hover:bg-slate-700">
              <TableHead className="text-white">Name</TableHead>
              <TableHead className="text-white">Category</TableHead>
              <TableHead className="text-white">Points</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Completion Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody data-testid="achievements-table-body">
            {filteredAchievements.length > 0 ? (
              filteredAchievements.map((achievement) => (
                <TableRow 
                  key={achievement.id} 
                  className="hover:bg-slate-700/50 border-slate-700"
                  data-testid={`achievement-row-${achievement.id}`}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">{achievement.name}</div>
                      <div className="text-sm text-slate-400">{achievement.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-700 text-slate-300 border-slate-600">
                      {achievement.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white">{achievement.points}</TableCell>
                  <TableCell>
                    {!achievement.isObtainable ? (
                      <Badge variant="outline" className="bg-slate-600 text-slate-300">
                        Unobtainable
                      </Badge>
                    ) : achievement.isCompleted ? (
                      <Badge className="bg-green-600 hover:bg-green-700">Completed</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500 text-amber-500">
                        Incomplete
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {achievement.completionDate
                      ? formatDate(achievement.completionDate)
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400" data-testid="no-achievements-message">
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
