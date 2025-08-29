import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { SERVERS } from "@/lib/constants"; // Import SERVERS

interface CharacterProfileProps {
  character: {
    id: string;
    name: string;
    server: string;
    avatar: string;
    achievementPoints: number;
    achievementsCompleted: number;
    totalAchievements: number;
  };
  actualStats?: {
    completed: number;
    total: number;
    obtainable: number;
    completionRate: number;
  } | null; // Changed to allow null
  isLoading?: boolean;
}

export function CharacterProfile({ character, actualStats, isLoading = false }: CharacterProfileProps) {
  // Use actual stats if available, otherwise fall back to character data
  const stats = useMemo(() => {
    if (actualStats) {
      console.log(`[Character Profile] Using actual stats:`, actualStats);
      return actualStats;
    }
    
    const fallbackStats = {
      completed: character.achievementsCompleted,
      total: character.totalAchievements,
      obtainable: character.totalAchievements,
      completionRate: character.totalAchievements > 0 
        ? Math.round((character.achievementsCompleted / character.totalAchievements) * 100) 
        : 0
    };
    
    console.log(`[Character Profile] Using fallback stats:`, fallbackStats);
    return fallbackStats;
  }, [actualStats, character]);

  // Get data center from server name
  const dataCenter = SERVERS[character.server as keyof typeof SERVERS] || 'Unknown Data Center';
  
  return (
    <Card className="compass-card p-6">
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-gold-500 flex-shrink-0 bg-compass-700">
          <Image
            src={character.avatar || "/placeholder.svg?height=96&width=96&text=Avatar"}
            alt={character.name}
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg?height=96&width=96&text=Avatar";
            }}
          />
        </div>
        
        <div className="flex-1 text-center md:text-left w-full">
          <h1 className="text-2xl font-bold text-compass-100">{character.name}</h1>
          <p className="text-compass-300 mb-4">
            {character.server} <span className="text-compass-400">({dataCenter})</span>
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Stat 
              label="Achievement Points" 
              value={character.achievementPoints.toLocaleString()} 
              isLoading={isLoading}
            />
            <Stat 
              label="Achievements Completed" 
              value={stats.completed.toLocaleString()} 
              isLoading={isLoading}
            />
            <Stat 
              label="Completion Rate" 
              value={`${stats.completionRate}%`} 
              isLoading={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-compass-300">
              <span>Progress</span>
              {isLoading ? (
                <Skeleton className="h-4 w-16 bg-compass-700" />
              ) : (
                <span>{stats.completed} / {stats.total}</span>
              )}
            </div>
            {isLoading ? (
              <Skeleton className="h-2 w-full bg-compass-700" />
            ) : (
              <Progress value={stats.completionRate} className="h-2" />
            )}
          </div>

          {actualStats && (
            <div className="mt-3 text-xs text-compass-400">
              <span>{stats.obtainable} obtainable achievements available</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, value, isLoading }: { label: string; value: string; isLoading: boolean }) {
  return (
    <Card className="p-3 text-center compass-card">
      <p className="text-sm text-compass-300">{label}</p>
      {isLoading ? (
        <Skeleton className="h-6 w-16 mx-auto mt-1 bg-compass-700" />
      ) : (
        <p className="text-xl font-bold text-compass-100">{value}</p>
      )}
    </Card>
  );
}