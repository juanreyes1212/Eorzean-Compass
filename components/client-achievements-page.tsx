"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertCircle, RefreshCw, HardDrive, Wifi, WifiOff, Database } from 'lucide-react';
import { ErrorBoundary } from "@/lib/error-boundary";
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
import { 
  UserPreferences, 
  StoredCharacter, 
  Character, // Imported from lib/types
  CompletedAchievement, // Imported from lib/types
  CharacterData, // Imported from lib/types
  AchievementWithTSRG // Imported from lib/types
} from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { AchievementsPageHeader } from "./achievements-page/AchievementsPageHeader";
import { AchievementsPageContent } from "./achievements-page/AchievementsPageContent";
import { AchievementDetailsModal } from "./achievement-details-modal"; // Import the modal
import { TSRGFiltersComponent } from "./tsrg-filters"; // Import TSRGFiltersComponent
import { ErrorState } from "./error-states/ErrorState";
import { LoadingState } from "./loading-states/LoadingState";
import { DevDebugPanel } from "./dev-debug-panel"; // Import DevDebugPanel

interface ClientAchievementsPageProps {
  name: string;
  server: string;
}

export function ClientAchievementsPage({ name, server }: ClientAchievementsPageProps) {
  // Add error boundary state
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
  const [selectedAchievementForDetails, setSelectedAchievementForDetails] = useState<AchievementWithTSRG | null>(null); // New state for details modal
  const { toast } = useToast();

  // Initialize storageInfo with a default, server-safe value
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    available: 0,
    characters: 0,
    hasAchievements: false,
    hasPreferences: false,
  });

  // Error handler wrapper
  const handleError = (error: Error, context: string) => {
    console.error(`[${context}] Error:`, error);
    setHasError(true);
    setErrorDetails(`${context}: ${error.message}`);
    
    toast({
      title: "Runtime Error",
      description: `${context}: ${error.message}`,
      variant: "destructive",
      icon: <AlertCircle className="h-4 w-4" />,
    });
  };
  // Update storageInfo after the component mounts on the client
  useEffect(() => {
    try {
      setStorageInfo(getStorageInfo());
    } catch (error) {
      handleError(error as Error, "Storage Info");
    }
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
    try {
      const storedPrefs = getStoredPreferences();
      if (storedPrefs) {
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...storedPrefs,
        });
      }
    } catch (error) {
      handleError(error as Error, "Load Preferences");
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    // UserPreferences can be directly stored as it's now the canonical type
    try {
      storePreferences(preferences);
    } catch (error) {
      handleError(error as Error, "Save Preferences");
    }
  }, [preferences]);

  const fetchCharacterData = async (forceRefresh = false) => {
    try {
      console.log(`[Character Fetch] Starting fetch for ${name} on ${server}, forceRefresh: ${forceRefresh}`);
      setLoading(true);
      if (!forceRefresh) { // Only clear error if not a forced refresh
        setError(null);
      }

      const cachedCharacter = getStoredCharacter(name, server);
      console.log(`[Character Fetch] Cached character found:`, !!cachedCharacter);
      
      if (cachedCharacter && !forceRefresh) {
        console.log(`[Character Fetch] Using cached data for ${cachedCharacter.name}`);
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

      console.log(`[Character Fetch] Making API request to /api/character`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      // Ensure this is a GET request to /api/character
      const response = await fetch(`/api/character?name=${encodeURIComponent(name)}&server=${encodeURIComponent(server)}`, {
        method: 'GET', // Explicitly set to GET
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`[Character Fetch] API response status: ${response.status}`);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error(`[Character Fetch] Failed to parse error response:`, parseError);
          // Fallback if error response is not JSON
        }
        // If character not found (404), set specific error and don't try cache
        if (response.status === 404) {
          setError(errorMessage);
          toast({
            title: "Search Failed",
            description: errorMessage,
            variant: "destructive",
            icon: <AlertCircle className="h-4 w-4" />,
          });
          setLoading(false);
          return; // Stop here, no character data to display
        }
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      console.log(`[Character Fetch] Response text length: ${responseText.length}`);
      
      let data: CharacterData;
      
      try {
        data = JSON.parse(responseText);
        console.log(`[Character Fetch] Parsed character data:`, {
          characterId: data.character?.id,
          characterName: data.character?.name,
          completedCount: data.completedAchievements?.length,
          isMockData: data._isMockData,
          hasError: !!data._error
        });
      } catch (parseError) {
        console.error(`[Character Fetch] JSON parse error:`, parseError);
        console.error(`[Character Fetch] Raw response:`, responseText.substring(0, 500));
        throw new Error("Invalid response format from server");
      }

      if (!data.character || !data.character.id) {
        console.error(`[Character Fetch] Invalid character data structure:`, data);
        throw new Error("Invalid character data structure");
      }
      
      const characterToStore: StoredCharacter = {
        ...data.character,
        completedAchievements: data.completedAchievements || [],
        lastUpdated: data.character.lastUpdated || new Date().toISOString(), // Ensure lastUpdated is set for storage
      };
      
      console.log(`[Character Fetch] Storing character with ${characterToStore.completedAchievements.length} completed achievements`);
      storeCharacter(characterToStore);
      addRecentSearch(name, server);

      setCharacterData(data);
      setError(null);

      if (data._isMockData) {
        toast({
          title: "Using Demo Data",
          description: data._error || 'Tomestone.gg API may be temporarily unavailable. Showing demo data.', // Corrected reference
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
      console.error(`[Character Fetch] Error:`, fetchError);
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error occurred';
      
      const cachedCharacter = getStoredCharacter(name, server);
      if (cachedCharacter && !forceRefresh) { // Only use cache if not forced refresh
        console.log(`[Character Fetch] Using cached character due to error`);
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
      console.log(`[Achievements Fetch] Starting achievements fetch, forceRefresh: ${forceRefresh}`);
      setAchievementsLoading(true);
      setAchievementsFetchProgress({ current: 0, total: 2500, isLoading: true });
      
      const cachedAchievements = getStoredAchievements();
      console.log(`[Achievements Fetch] Cached achievements found:`, !!cachedAchievements);
      
      if (cachedAchievements && characterData && !forceRefresh) {
        const completedAchievementIds = new Set(characterData.completedAchievements?.map(comp => comp.id) || []);
        console.log(`[Achievements Fetch] Using cached achievements. Completed IDs count: ${completedAchievementIds.size}`);
        console.log(`[Achievements Fetch] Cached achievements count: ${cachedAchievements.length}`);
        console.log(`[Achievements Fetch] Sample completed IDs:`, Array.from(completedAchievementIds).slice(0, 10));
        
        const achievementsWithStatus = cachedAchievements.map((achievement: any) => {
          const isCompleted = completedAchievementIds.has(achievement.id);
          
          if (isCompleted) {
            console.log(`[Achievements Fetch] Marking achievement as completed: ${achievement.name} (ID: ${achievement.id})`);
          }
          
          return {
            ...achievement,
            isCompleted,
            tsrg: achievement.tsrg || calculateTSRGScore(achievement),
          };
        });
        
        console.log(`[Achievements Fetch] Final achievements with status: ${achievementsWithStatus.length}`);
        console.log(`[Achievements Fetch] Completed achievements in final list: ${achievementsWithStatus.filter(a => a.isCompleted).length}`);
        
        setAllAchievements(achievementsWithStatus);
        setAchievementsFetchProgress({ current: achievementsWithStatus.length, total: achievementsWithStatus.length, isLoading: false });
        setAchievementsLoading(false);
        
        toast({
          title: "Loaded from Cache",
          description: `Using ${achievementsWithStatus.length} cached achievements.`,
          variant: "default",
          icon: <HardDrive className="h-4 w-4" />,
        });
        return;
      }

      console.log("[Achievements Fetch] Starting fresh achievements fetch from API...");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const response = await fetch('/api/achievements', {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      console.log(`[Achievements Fetch] API response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Achievements Fetch] API error: ${response.status} - ${errorText}`);
        throw new Error('Failed to fetch achievements');
      }
      
      const responseText = await response.text();
      let achievements;
      
      try {
        achievements = JSON.parse(responseText);
        console.log(`[Achievements Fetch] Received ${achievements.length} achievements from API`);
      } catch (parseError) {
        console.error(`[Achievements Fetch] JSON parse error:`, parseError);
        console.error(`[Achievements Fetch] Raw response:`, responseText.substring(0, 500));
        throw new Error("Invalid JSON response from achievements API");
      }
      
      if (!Array.isArray(achievements)) {
        console.error(`[Achievements Fetch] Expected array, got:`, typeof achievements);
        throw new Error("Invalid achievements data format");
      }
      
      storeAchievements(achievements);
      
      const completedAchievementIds = new Set(characterData?.completedAchievements?.map(comp => comp.id) || []);
      console.log(`[Achievements Fetch] Processing ${achievements.length} achievements with ${completedAchievementIds.size} completed IDs`);
      console.log(`[Achievements Fetch] Sample completed IDs:`, Array.from(completedAchievementIds).slice(0, 10));
      
      const achievementsWithTSRG = achievements.map((achievement: any) => {
        if (!achievement.id || !achievement.name) {
          console.warn(`[Achievements Fetch] Invalid achievement:`, achievement);
          return null;
        }
        
        const isCompleted = completedAchievementIds.has(achievement.id);
        
        if (isCompleted) {
          console.log(`[Achievements Fetch] Found completed achievement: ${achievement.name} (ID: ${achievement.id})`);
        }
        
        return {
          ...achievement,
          isCompleted,
          tsrg: achievement.tsrg || calculateTSRGScore(achievement),
        };
      }).filter(Boolean); // Remove any null entries
      
      const completedCount = achievementsWithTSRG.filter(a => a.isCompleted).length;
      console.log(`[Achievements Fetch] Final processed achievements: ${achievementsWithTSRG.length}`);
      console.log(`[Achievements Fetch] Marked as completed: ${completedCount}`);
      
      setAllAchievements(achievementsWithTSRG);
      setAchievementsFetchProgress({ current: achievementsWithTSRG.length, total: achievementsWithTSRG.length, isLoading: false });
      
      toast({
        title: "Achievements Loaded",
        description: `Successfully loaded ${achievementsWithTSRG.length} achievements with TSR-G analysis.`,
        variant: "default",
        icon: <Database className="h-4 w-4" />,
      });
    } catch (fetchError) {
      console.error(`[Achievements Fetch] Error:`, fetchError);
      setAllAchievements([]);
      setAchievementsFetchProgress({ current: 0, total: 0, isLoading: false });
      
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
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

  // Initial fetch
  useEffect(() => {
    try {
      fetchCharacterData();
    } catch (error) {
      handleError(error as Error, "Initial Character Fetch");
    }
  }, [name, server]);

  useEffect(() => {
    try {
      if (characterData) {
        console.log(`[Effect] Character data loaded, fetching achievements...`);
        fetchAchievementsWithTSRG();
      }
    } catch (error) {
      handleError(error as Error, "Character Data Effect");
    }
  }, [characterData]);

  // Log data for debugging recommendations and projects
  useEffect(() => {
    try {
      if (characterData && allAchievements.length > 0) {
        console.log("[Debug] characterData.completedAchievements (IDs only):", characterData.completedAchievements.map(a => a.id));
        console.log("[Debug] allAchievements count:", allAchievements.length);
        const completedInAll = allAchievements.filter(a => a.isCompleted).length;
        console.log("[Debug] allAchievements with isCompleted=true count:", completedInAll);
        
        // Additional debugging
        const sampleCompleted = allAchievements.filter(a => a.isCompleted).slice(0, 5);
        console.log("[Debug] Sample completed achievements:", sampleCompleted.map(a => ({ id: a.id, name: a.name })));
      }
    } catch (error) {
      handleError(error as Error, "Debug Logging");
    }
  }, [characterData, allAchievements]);


  // Handle achievement click from recommendations or table
  const handleAchievementClick = (achievement: AchievementWithTSRG) => {
    // First, open the details modal
    try {
      console.log(`[Achievement Click] Clicked achievement: ${achievement.name} (ID: ${achievement.id})`);
      setSelectedAchievementForDetails(achievement);

    // Then, if coming from recommendations, switch to achievements tab and highlight
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
      console.log(`[Refresh] Refreshing all data...`);
      fetchCharacterData(true);
      fetchAchievementsWithTSRG(true);
    } catch (error) {
      handleError(error as Error, "Refresh Data");
    }
  };

  // Show error boundary if we have a critical error
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
        
        {process.env.NODE_ENV === 'development' && (
          <Card className="mt-6 p-4 compass-card">
            <h3 className="text-compass-100 font-medium mb-2">Debug Information:</h3>
            <pre className="text-xs text-compass-400 bg-compass-900 p-2 rounded overflow-auto">
              {errorDetails}
            </pre>
          </Card>
        )}
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
            message="Fetching character information from Tomestone.gg..."
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
                  Fetching achievements from FFXIVCollect and Tomestone.gg...
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

      {/* TSR-G Filters Component moved here */}
        <TSRGFiltersComponent filters={preferences} onFiltersChange={setPreferences} />

      {/* Development Debug Panel */}
        {process.env.NODE_ENV === 'development' && (
          <DevDebugPanel />
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

      {/* Achievement Details Modal */}
        <AchievementDetailsModal 
          achievement={selectedAchievementForDetails}
          isOpen={!!selectedAchievementForDetails}
          onClose={() => setSelectedAchievementForDetails(null)}
        />
      </div>
    </ErrorBoundary>
  );
}