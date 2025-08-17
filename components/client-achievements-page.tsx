"use client";

import { useState, useEffect, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Info, AlertCircle, RefreshCw, HardDrive, Wifi, WifiOff } from 'lucide-react';
import { AchievementWithTSRG } from "@/lib/tsrg-matrix";
import { calculateTSRGScore } from "@/lib/tsrg-matrix";
import { 
  getStoredCharacter, 
  storeCharacter, 
  getStoredPreferences, 
  storePreferences,
  getStoredAchievements,
  storeAchievements,
  addRecentSearch,
  getStorageInfo,
} from "@/lib/storage";
import { DEFAULT_PREFERENCES } from "@/lib/constants";
import { UserPreferences, StoredCharacter, StoredPreferences } from "@/lib/types";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { AchievementsPageHeader } from "./achievements-page/AchievementsPageHeader";
import { AchievementsPageContent } from "./achievements-page/AchievementsPageContent";

interface Character {
  id: string;
  name: string;
  server: string;
  avatar: string;
  achievementPoints: number;
  achievementsCompleted: number;
  totalAchievements: number;
}

interface CompletedAchievement {
  id: number;
  completionDate: string;
}

interface CharacterData {
  character: Character;
  completedAchievements: CompletedAchievement[];
  _isMockData?: boolean;
  _isRealData?: boolean;
  _error?: string;
}

interface ClientAchievementsPageProps {
  name: string;
  server: string;
}

export function ClientAchievementsPage({ name, server }: ClientAchievementsPageProps) {
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [allAchievements, setAllAchievements] = useState<AchievementWithTSRG[]>([]);
  const [loading, setLoading] = useState(true);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const { toast } = useToast();

  // Initialize storageInfo with a default, server-safe value
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    available: 0,
    characters: 0,
    hasAchievements: false,
    hasPreferences: false,
  });

  // Update storageInfo after the component mounts on the client
  useEffect(() => {
    setStorageInfo(getStorageInfo());
  }, []);

  // Calculate actual stats from loaded achievements
  const actualStats = useMemo(() => {
    if (allAchievements.length === 0 || !characterData) {
      return null;
    }

    const total = allAchievements.length;
    const completed = allAchievements.filter(a => a.isCompleted).length;
    const obtainable = allAchievements.filter(a => a.isObtainable).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      obtainable,
      completionRate,
    };
  }, [allAchievements, characterData]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const storedPrefs = getStoredPreferences();
    if (storedPrefs) {
      setPreferences({
        ...DEFAULT_PREFERENCES,
        ...storedPrefs,
      });
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    const prefsToStore: StoredPreferences = {
      maxTimeScore: preferences.maxTimeScore,
      maxSkillScore: preferences.maxSkillScore,
      maxRngScore: preferences.maxRngScore,
      maxGroupScore: preferences.maxGroupScore,
      hideCompleted: preferences.hideCompleted,
      hideUnobtainable: preferences.hideUnobtainable,
      selectedTiers: preferences.selectedTiers,
      preferredCategories: preferences.preferredCategories,
      excludedCategories: preferences.excludedCategories,
    };
    storePreferences(prefsToStore);
  }, [preferences]);

  const fetchCharacterData = async (isRetry = false) => {
    try {
      setLoading(true);
      if (!isRetry) {
        setError(null);
      }

      const cachedCharacter = getStoredCharacter(name, server);
      if (cachedCharacter && !isRetry) {
        setCharacterData({
          character: cachedCharacter,
          completedAchievements: cachedCharacter.completedAchievements,
          _isMockData: false,
        });
        setLoading(false);
        toast({
          title: "Loaded from Cache",
          description: `Using cached data for ${cachedCharacter.name}.`,
          variant: "default",
          icon: <HardDrive className="h-4 w-4" />,
        });
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await fetch('/api/character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, server }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // Fallback if error response is not JSON
        }
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      let data: CharacterData;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Invalid response format from server");
      }

      if (!data.character || !data.character.id) {
        throw new Error("Invalid character data structure");
      }
      
      const characterToStore: StoredCharacter = {
        ...data.character,
        completedAchievements: data.completedAchievements || [],
        lastUpdated: new Date().toISOString(),
      };
      storeCharacter(characterToStore);
      addRecentSearch(name, server);

      setCharacterData(data);
      setError(null);

      if (data._isMockData) {
        toast({
          title: "Using Demo Data",
          description: data._error || 'XIVAPI may be temporarily unavailable. Showing demo data.',
          variant: "default",
          icon: <WifiOff className="h-4 w-4" />,
        });
      } else {
        toast({
          title: "Character Data Loaded",
          description: `Successfully loaded real data for ${data.character.name}.`,
          variant: "default",
          icon: <Wifi className="h-4 w-4" />,
        });
      }

    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error occurred';
      
      const cachedCharacter = getStoredCharacter(name, server);
      if (cachedCharacter) {
        setCharacterData({
          character: cachedCharacter,
          completedAchievements: cachedCharacter.completedAchievements,
          _isMockData: false,
          _error: 'Using cached data - unable to fetch fresh data',
        });
        toast({
          title: "Network Error",
          description: `${errorMessage}. Using cached data.`,
          variant: "destructive",
          icon: <AlertCircle className="h-4 w-4" />,
        });
      } else {
        setError(errorMessage);
        toast({
          title: "Error Loading Character",
          description: errorMessage,
          variant: "destructive",
          icon: <AlertCircle className="h-4 w-4" />,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievementsWithTSRG = async () => {
    try {
      setAchievementsLoading(true);
      
      const cachedAchievements = getStoredAchievements();
      if (cachedAchievements && characterData) {
        const achievementsWithStatus = cachedAchievements.map((achievement: any) => {
          const isCompleted = characterData.completedAchievements?.some(comp => comp.id === achievement.id) || false;
          const completionDate = characterData.completedAchievements?.find(comp => comp.id === achievement.id)?.completionDate || null;
          
          return {
            ...achievement,
            isCompleted,
            completionDate,
            tsrg: achievement.tsrg || calculateTSRGScore(achievement),
          };
        });
        
        setAllAchievements(achievementsWithStatus);
        setAchievementsLoading(false);
        return;
      }

      const response = await fetch('/api/achievements');
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }
      
      const achievements = await response.json();
      storeAchievements(achievements);
      
      const achievementsWithTSRG = achievements.map((achievement: any) => {
        const isCompleted = characterData?.completedAchievements?.some(comp => comp.id === achievement.id) || false;
        const completionDate = characterData?.completedAchievements?.find(comp => comp.id === achievement.id)?.completionDate || null;
        
        return {
          ...achievement,
          isCompleted,
          completionDate,
          tsrg: achievement.tsrg || calculateTSRGScore(achievement),
        };
      });
      
      setAllAchievements(achievementsWithTSRG);
    } catch (fetchError) {
      setAllAchievements([]);
      toast({
        title: "Error Loading Achievements",
        description: "Failed to load achievement data. Please try refreshing.",
        variant: "destructive",
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setAchievementsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCharacterData();
  }, [name, server]);

  useEffect(() => {
    if (characterData) {
      fetchAchievementsWithTSRG();
    }
  }, [characterData]);

  // Handle achievement click from recommendations
  const handleAchievementClick = (achievement: AchievementWithTSRG) => {
    const achievementsTab = document.querySelector('[value="achievements"]') as HTMLElement;
    if (achievementsTab) {
      achievementsTab.click();
    }
    
    setTimeout(() => {
      const achievementRow = document.querySelector(`[data-testid="achievement-row-${achievement.id}"]`);
      if (achievementRow) {
        achievementRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        achievementRow.classList.add('bg-blue-900/50');
        setTimeout(() => {
          achievementRow.classList.remove('bg-blue-900/50');
        }, 3000);
      }
    }, 100);
  };

  const handleRetry = () => {
    fetchCharacterData(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-compass-950 container mx-auto px-4 py-8">
        <Skeleton className="h-32 w-full mb-8" />
        <div className="compass-card p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="flex gap-4 mb-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-64" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error && !characterData) {
    return (
      <div className="min-h-screen bg-compass-950 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4 text-compass-100">Error Loading Character</h1>
          <Alert variant="destructive" className="mb-6 max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <p className="mb-8 text-compass-300">
            This might be due to XIVAPI being temporarily unavailable or network issues.
          </p>
          <div className="space-x-4">
            <Button onClick={handleRetry} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Try Again
            </Button>
            <Link href="/">
              <Button variant="outline">Return Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!characterData) {
    return (
      <div className="min-h-screen bg-compass-950 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4 text-compass-100">No Character Data</h1>
          <p className="mb-8 text-compass-300">Unable to load character information.</p>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const completedAchievementsWithTSRG = allAchievements.filter(a => a.isCompleted);

  return (
    <div className="min-h-screen bg-compass-950 container mx-auto px-4 py-8">
      <AchievementsPageHeader
        characterData={characterData}
        actualStats={actualStats}
        achievementsLoading={achievementsLoading}
        storageInfo={storageInfo}
      />
      
      <AchievementsPageContent
        allAchievements={allAchievements}
        completedAchievementsWithTSRG={completedAchievementsWithTSRG}
        preferences={preferences}
        setPreferences={setPreferences}
        achievementsLoading={achievementsLoading}
        characterId={characterData.character.id}
        completedAchievements={characterData.completedAchievements || []}
        onAchievementClick={handleAchievementClick}
      />
    </div>
  );
}