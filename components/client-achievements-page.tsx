"use client";

import { useState, useEffect, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertCircle, RefreshCw, HardDrive, Wifi, WifiOff } from 'lucide-react';
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
    // UserPreferences can be directly stored as it's now the canonical type
    storePreferences(preferences);
  }, [preferences]);

  const fetchCharacterData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (!forceRefresh) { // Only clear error if not a forced refresh
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

      // Ensure this is a GET request to /api/character
      const response = await fetch(`/api/character?name=${encodeURIComponent(name)}&server=${encodeURIComponent(server)}`, {
        method: 'GET', // Explicitly set to GET
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
        lastUpdated: data.character.lastUpdated || new Date().toISOString(), // Ensure lastUpdated is set for storage
      };
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
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error occurred';
      
      const cachedCharacter = getStoredCharacter(name, server);
      if (cachedCharacter && !forceRefresh) { // Only use cache if not forced refresh
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
      
      const cachedAchievements = getStoredAchievements();
      if (cachedAchievements && characterData && !forceRefresh) {
        const completedAchievementIds = new Set(characterData.completedAchievements?.map(comp => comp.id));
        console.log("ClientAchievementsPage: Using cached achievements. Completed IDs count:", completedAchievementIds.size);
        const achievementsWithStatus = cachedAchievements.map((achievement: any) => {
          const isCompleted = completedAchievementIds.has(achievement.id);
          
          return {
            ...achievement,
            isCompleted,
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
      
      const completedAchievementIds = new Set(characterData?.completedAchievements?.map(comp => comp.id));
      console.log("ClientAchievementsPage: Fetched fresh achievements. Completed IDs count:", completedAchievementIds.size);
      const achievementsWithTSRG = achievements.map((achievement: any) => {
        const isCompleted = completedAchievementIds.has(achievement.id);
        
        return {
          ...achievement,
          isCompleted,
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

  // Log data for debugging recommendations and projects
  useEffect(() => {
    if (characterData && allAchievements.length > 0) {
      console.log("ClientAchievementsPage: characterData.completedAchievements (IDs only):", characterData.completedAchievements.map(a => a.id));
      console.log("ClientAchievementsPage: allAchievements count:", allAchievements.length);
      const completedInAll = allAchievements.filter(a => a.isCompleted).length;
      console.log("ClientAchievementsPage: allAchievements with isCompleted=true count:", completedInAll);
    }
  }, [characterData, allAchievements]);


  // Handle achievement click from recommendations or table
  const handleAchievementClick = (achievement: AchievementWithTSRG) => {
    // First, open the details modal
    setSelectedAchievementForDetails(achievement);

    // Then, if coming from recommendations, switch to achievements tab and highlight
    const achievementsTab = document.querySelector('[value="achievements"]') as HTMLElement;
    if (achievementsTab && document.querySelector('[data-state="active"]')?.getAttribute('value') !== 'achievements') {
      achievementsTab.click();
    }
    
    // Highlight the row after a short delay to allow tab transition
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

  const handleRefreshData = () => {
    fetchCharacterData(true); // Force refresh character data
    fetchAchievementsWithTSRG(true); // Force refresh achievements data
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-compass-950 container mx-auto px-4 py-8">
        <LoadingState 
          type="dashboard" 
          title="Loading Character Data" 
          message="Fetching character information and achievements..."
        />
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
    <div className="min-h-screen bg-compass-950 container mx-auto px-4 py-8">
      <AchievementsPageHeader
        characterData={characterData}
        actualStats={actualStats}
        achievementsLoading={achievementsLoading}
        storageInfo={storageInfo}
        onRefreshData={handleRefreshData} // Pass the refresh handler
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
          </AlertDescription>
        </Alert>
      )}

      {/* TSR-G Filters Component moved here */}
      <TSRGFiltersComponent filters={preferences} onFiltersChange={setPreferences} />

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
  );
}