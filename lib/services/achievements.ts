import { getStoredAchievements, storeAchievements } from '@/lib/storage';
import { calculateTSRGScore, type AchievementWithTSRG } from '@/lib/tsrg-matrix';

class AchievementsService {
  private readonly API_TIMEOUT = 30000; // 30 seconds

  async getAllAchievements(): Promise<AchievementWithTSRG[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.API_TIMEOUT);

    try {
      const response = await fetch('/api/achievements', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch achievements: HTTP ${response.status}`);
      }

      const achievements = await response.json();

      if (!Array.isArray(achievements)) {
        throw new Error('Invalid achievements data format');
      }

      // Process achievements with TSR-G scores
      const processedAchievements = achievements.map(achievement => ({
        ...achievement,
        tsrg: achievement.tsrg || calculateTSRGScore(achievement),
      }));

      // Cache the results
      storeAchievements(processedAchievements);

      return processedAchievements;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out while fetching achievements');
      }
      
      throw error;
    }
  }

  getCachedAchievements(): AchievementWithTSRG[] | null {
    return getStoredAchievements();
  }
}

export const achievementsService = new AchievementsService();