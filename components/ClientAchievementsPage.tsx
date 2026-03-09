"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, CircleAlert as AlertCircle, HardDrive, Wifi, WifiOff, Database } from 'lucide-react';
import { ErrorBoundary } from "@/lib/error-boundary";
import {
  getStoredCharacter,
  storeCharacter,
  getStoredPreferences,
  storePreferences,
  getStoredAchievements,
  storeAchievements,
  getStoredCharacterAchievements,
  storeCharacterAchievements,
  getCharacterAchievementsCacheAge,
  addRecentSearch,
  getStorageInfo,
} from "@/lib/storage";
import { DEFAULT_PREFERENCES } from "@/lib/constants";
import {
  UserPreferences,
  StoredCharacter,
  CharacterData,
  AchievementWithTSRG
} from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { AchievementsPageHeader } from "./achievements-page/AchievementsPageHeader";
import { AchievementsPageContent } from "./achievements-page/AchievementsPageContent";
import { AchievementDetailsModal } from "./AchievementDetailsModal";
import { TSRGFiltersComponent } from "./TsrgFilters";
import { ErrorState } from "./error-states/ErrorState";
import { LoadingState } from "./loading-states/LoadingState";

interface ClientAchievementsPageProps {
  name: string;
  server: string;
}

export function ClientAchievementsPage({ name, server }: ClientAchievementsPageProps) {
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [allAchievements, setAllAchievements] = useState<AchievementWithTSRG[]>([]);
  const [loading, setLoading] = useState(true);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [achievementsFetchProgress, setAchievementsFetchProgress] = useState<{
    current: number;
    total: number;
    isLoading: boolean;
  }>({ current: 0, total: 0, isLoading: false });
  const [selectedAchievementForDetails, setSelectedAchievementForDetails] = useState<AchievementWithTSRG | null>(null);
  const { toast } = useToast();

  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    available: 0,
    characters: 0,
    hasAchievements: false,
    hasPreferences: false,
  });

  const handleError = (error: Error, context: string) => {
    console.error(`[${context}]`, error);
    setHasError(true);
    setErrorDetails(`${context}: ${error.message}`);

    toast({
      title: "Runtime Error",
      description: `${context}: ${error.message}`,
      variant: "destructive",
      icon: <AlertCircle className="h-4 w-4" />,
    });
  };

  useEffect(() => {
    try {
      setStorageInfo(getStorageInfo());
    } catch (error) {
      handleError(error as Error, "Storage Info");
    }
  }, []);

  const actualStats = useMemo(() => {
    if (allAchievements.length === 0 || !characterData) {
      return null;
    }

    const total = allAchievements.length;
    const completed = allAchievements.filter(a => a.isCompleted).length;
    const obtainable = allAchievements.filter(a => a.isObtainable).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, obtainable, completionRate };
  }, [allAchievements, characterData]);

  useEffect(() => {
    try {
      const storedPrefs = getStoredPreferences();
      if (storedPrefs) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...storedPrefs });
      }
    } catch (error) {
      handleError(error as Error, "Load Preferences");
    }
  }, []);

  useEffect(() => {
    try {
      storePreferences(preferences);
    } catch (error) {
      handleError(error as Error, "Save Preferences");
    }
  }, [preferences]);

  const fetchCharacterData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (!forceRefresh) {
        setError(null);
      }

      const cachedCharacter = getStoredCharacter(name, server);

      if (cachedCharacter && !forceRefresh) {
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

      const response = await fetch(`/api/character?name=${encodeURIComponent(name)}&server=${encodeURIComponent(server)}`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Fallback if error response is not JSON
        }
        if (response.status === 404) {
          setError(errorMessage);
          toast({
            title: "Search Failed",
            description: errorMessage,
            variant: "destructive",
            icon: <AlertCircle className="h-4 w-4" />,
          });
          setLoading(false);
          return;
        }
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      let data: CharacterData;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("Invalid response format from server");
      }

      if (!data.character || !data.character.id) {
        throw new Error("Invalid character data structure");
      }

      const characterToStore: StoredCharacter = {
        ...data.character,
        completedAchievements: [],
        lastUpdated: data.character.lastUpdated || new Date().toISOString(),
      };

      storeCharacter(characterToStore);
      addRecentSearch(name, server);
      setCharacterData(data);
      setError(null);

      if (data._isMockData) {
        toast({
          title: "Using Demo Data",
          description: data._error || 'Lodestone search is temporarily unavailable. Showing demo data.',
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
      console.error("Character fetch error:", fetchError);
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error occurred';

      const cachedCharacter = getStoredCharacter(name, server);
      if (cachedCharacter && !forceRefresh) {
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

  const fetchAchievementsWithTSRG = async (forceRefresh = false) => {
    try {
      setAchievementsLoading(true);
      setAchievementsFetchProgress({ current: 0, total: 2500, isLoading: true });

      const lodestoneId = (characterData as any)?.lodestoneId;

      if (!forceRefresh) {
        if (lodestoneId) {
          const cachedCharAchievements = getStoredCharacterAchievements(String(lodestoneId));
          if (cachedCharAchievements) {
            const cacheAge = getCharacterAchievementsCacheAge(String(lodestoneId));
            const hoursRemaining = cacheAge ? Math.max(0, Math.ceil((6 * 60 * 60 * 1000 - cacheAge) / (60 * 60 * 1000))) : 0;

            setAllAchievements(cachedCharAchievements);
            setAchievementsFetchProgress({ current: cachedCharAchievements.length, total: cachedCharAchievements.length, isLoading: false });
            setAchievementsLoading(false);

            const completedCount = cachedCharAchievements.filter((a: any) => a.isCompleted).length;
            if (characterData && completedCount > 0) {
              setCharacterData(prev => prev ? {
                ...prev,
                character: {
                  ...prev.character,
                  achievementsCompleted: completedCount,
                  totalAchievements: cachedCharAchievements.length,
                }
              } : null);
            }

            toast({
              title: "Loaded from Cache",
              description: `Using cached data (${cachedCharAchievements.length} achievements, refreshes in ${hoursRemaining}h).`,
              variant: "default",
              icon: <HardDrive className="h-4 w-4" />,
            });
            return;
          }
        } else {
          const cachedAchievements = getStoredAchievements();
          if (cachedAchievements) {
            setAllAchievements(cachedAchievements);
            setAchievementsFetchProgress({ current: cachedAchievements.length, total: cachedAchievements.length, isLoading: false });
            setAchievementsLoading(false);

            toast({
              title: "Loaded from Cache",
              description: `Using cached achievement data (${cachedAchievements.length} achievements).`,
              variant: "default",
              icon: <HardDrive className="h-4 w-4" />,
            });
            return;
          }
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const apiUrl = lodestoneId ? `/api/achievements?lodestoneId=${lodestoneId}` : '/api/achievements';

      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }

      const responseText = await response.text();
      let parsed;

      try {
        parsed = JSON.parse(responseText);
      } catch {
        throw new Error("Invalid JSON response from achievements API");
      }

      const achievements = parsed.achievements ?? parsed;
      const metadata = parsed.metadata ?? null;

      if (!Array.isArray(achievements)) {
        throw new Error("Invalid achievements data format");
      }

      const achievementsWithTSRG = achievements.filter((achievement: any) =>
        achievement.id && achievement.name
      );

      const completedCount = achievementsWithTSRG.filter((a: any) => a.isCompleted).length;

      if (characterData && completedCount > 0) {
        setCharacterData(prev => prev ? {
          ...prev,
          character: {
            ...prev.character,
            achievementsCompleted: completedCount,
            totalAchievements: achievementsWithTSRG.length,
          }
        } : null);
      }

      if (lodestoneId) {
        storeCharacterAchievements(String(lodestoneId), achievementsWithTSRG);
      } else {
        const achievementsForCache = achievementsWithTSRG.map((a: any) => ({
          ...a,
          isCompleted: false,
        }));
        storeAchievements(achievementsForCache);
      }

      setAllAchievements(achievementsWithTSRG);
      setAchievementsFetchProgress({ current: achievementsWithTSRG.length, total: achievementsWithTSRG.length, isLoading: false });

      if (metadata?.usedFallback) {
        toast({
          title: "Completion Data Unavailable",
          description: `Loaded ${achievementsWithTSRG.length} achievements, but character-specific completion data could not be retrieved. Try refreshing later.`,
          variant: "default",
          icon: <Info className="h-4 w-4" />,
        });
      } else {
        toast({
          title: "Achievements Loaded",
          description: `Successfully loaded ${achievementsWithTSRG.length} achievements with ${completedCount} completed.`,
          variant: "default",
          icon: <Database className="h-4 w-4" />,
        });
      }
    } catch (fetchError) {
      console.error("Achievements fetch error:", fetchError);
      setAllAchievements([]);
      setAchievementsFetchProgress({ current: 0, total: 0, isLoading: false });

      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      setError(`Failed to load achievements: ${errorMessage}`);
      toast({
        title: "Error Loading Achievements",
        description: `Failed to load achievement data: ${errorMessage}. Please try refreshing.`,
        variant: "destructive",
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setAchievementsLoading(false);
    }
  };

  const characterId = characterData?.character.id;

  useEffect(() => {
    try {
      fetchCharacterData();
    } catch (error) {
      handleError(error as Error, "Initial Character Fetch");
    }
  }, [name, server]);

  useEffect(() => {
    try {
      if (characterId) {
        fetchAchievementsWithTSRG();
      }
    } catch (error) {
      handleError(error as Error, "Character Data Effect");
    }
  }, [characterId]);

  const handleAchievementClick = (achievement: AchievementWithTSRG) => {
    try {
      setSelectedAchievementForDetails(achievement);

      const achievementsTab = document.querySelector('[value="achievements"]') as HTMLElement;
      if (achievementsTab && document.querySelector('[data-state="active"]')?.getAttribute('value') !== 'achievements') {
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
    } catch (error) {
      handleError(error as Error, "Achievement Click");
    }
  };

  const handleRefreshData = () => {
    try {
      setError(null);
      setHasError(false);
      fetchCharacterData(true);
    } catch (error) {
      handleError(error as Error, "Refresh Data");
    }
  };

  if (hasError) {
    return (
      <div className="min-h-screen bg-compass-950 container mx-auto px-4 py-8">
        <ErrorState
          title="Runtime Error"
          message={errorDetails}
          type="generic"
          onRetry={() => {
            setHasError(false);
            setErrorDetails("");
            window.location.reload();
          }}
          showHomeButton={true}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-compass-950 container mx-auto px-4 py-8">
        <div className="space-y-6">
          <LoadingState
            type="dashboard"
            title="Loading Character Data"
            message="Fetching character information..."
          />
          {achievementsFetchProgress.isLoading && (
            <Card className="p-6 compass-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-compass-100">Loading All Achievements</h3>
                  <span className="text-compass-300">
                    {achievementsFetchProgress.current} / {achievementsFetchProgress.total}
                  </span>
                </div>
                <div className="w-full bg-compass-800 rounded-full h-2">
                  <div
                    className="bg-gold-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${achievementsFetchProgress.total > 0 ? (achievementsFetchProgress.current / achievementsFetchProgress.total) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <p className="text-sm text-compass-400">
                  Fetching achievements from FFXIVCollect...
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (error && !characterData) {
    return (
      <div className="min-h-screen bg-compass-950 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16">
          <ErrorState
            title="Error Loading Character"
            message={`${error}. Please check the character name and server, or try again later.`}
            type="api"
            onRetry={handleRefreshData}
            showHomeButton={true}
          />
        </div>
      </div>
    );
  }

  if (!characterData) {
    return (
      <div className="min-h-screen bg-compass-950 container mx-auto px-4 py-8">
        <ErrorState
          title="No Character Data"
          message="Unable to load character information."
          type="generic"
          onRetry={handleRefreshData}
          showHomeButton={true}
        />
      </div>
    );
  }

  const completedAchievementsWithTSRG = allAchievements.filter(a => a.isCompleted);

  return (
    <ErrorBoundary fallback={({ error, retry }) => (
      <div className="min-h-screen bg-compass-950 container mx-auto px-4 py-8">
        <ErrorState
          title="Component Error"
          message={error.message}
          type="generic"
          onRetry={retry}
          showHomeButton={true}
        />
      </div>
    )}>
      <div className="min-h-screen bg-compass-950 container mx-auto px-4 py-8">
        <AchievementsPageHeader
          characterData={characterData}
          actualStats={actualStats}
          achievementsLoading={achievementsLoading}
          storageInfo={storageInfo}
          onRefreshData={handleRefreshData}
        />

        {characterData._isMockData && characterData._error?.includes("private profile") && (
          <Alert variant="destructive" className="mb-6 bg-red-900/20 border-red-700 text-red-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {characterData._error} To view real achievement data, please ensure your character's achievements are set to public on the FFXIV Lodestone.
            </AlertDescription>
          </Alert>
        )}
        {characterData._isMockData && !characterData._error?.includes("private profile") && (
          <Alert variant="default" className="mb-6 bg-compass-900/20 border-compass-700 text-compass-300">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {characterData._error || "Using demo data due to an API issue. Please try again later for real-time data."}
              {achievementsFetchProgress.isLoading && (
                <div className="mt-2">
                  <div className="text-sm">Loading achievements: {achievementsFetchProgress.current} / {achievementsFetchProgress.total}</div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!achievementsLoading && allAchievements.length > 0 && (
          <TSRGFiltersComponent filters={preferences} onFiltersChange={setPreferences} />
        )}

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

        <AchievementDetailsModal
          achievement={selectedAchievementForDetails}
          isOpen={!!selectedAchievementForDetails}
          onClose={() => setSelectedAchievementForDetails(null)}
        />
      </div>
    </ErrorBoundary>
  );
}
