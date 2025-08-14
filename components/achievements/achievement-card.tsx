"use client";

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Clock, Zap, Dice6, Users } from 'lucide-react';
import { AchievementIcon, getAchievementIconUrl } from '@/components/achievement-icon';
import { getTierName, getTierColor, type AchievementWithTSRG } from '@/lib/tsrg-matrix';

interface AchievementCardProps {
  achievement: AchievementWithTSRG;
  onClick?: () => void;
}

export function AchievementCard({ achievement, onClick }: AchievementCardProps) {
  return (
    <Card
      className={`compass-card cursor-pointer transition-all hover:scale-105 ${
        achievement.isCompleted ? 'achievement-completed' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <AchievementIcon
            icon={getAchievementIconUrl(achievement.icon)}
            name={achievement.name}
            size="md"
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-compass-100 truncate">{achievement.name}</h3>
            <Badge variant="outline" className="mt-1 bg-compass-700 text-compass-300 border-compass-600 text-xs">
              {achievement.category}
            </Badge>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={`${getTierColor(achievement.tsrg.tier)} text-white text-xs`}>
              {getTierName(achievement.tsrg.tier)}
            </Badge>
            <div className="text-xs text-compass-300">{achievement.points}pts</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-compass-400 line-clamp-2">{achievement.description}</p>

        {/* TSR-G Scores */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-gold-400" />
            <span className="text-compass-200">{achievement.tsrg.time}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-compass-400" />
            <span className="text-compass-200">{achievement.tsrg.skill}</span>
          </div>
          <div className="flex items-center gap-1">
            <Dice6 className="h-3 w-3 text-earth-400" />
            <span className="text-compass-200">{achievement.tsrg.rng}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-silver-400" />
            <span className="text-compass-200">{achievement.tsrg.group}</span>
          </div>
        </div>

        {/* Status and Rarity */}
        <div className="flex items-center justify-between">
          <div>
            {!achievement.isObtainable ? (
              <Badge variant="outline" className="bg-compass-600 text-compass-300 text-xs">
                Unobtainable
              </Badge>
            ) : achievement.isCompleted ? (
              <Badge className="bg-green-600 hover:bg-green-700 text-xs">Completed</Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500 text-amber-500 text-xs">
                Incomplete
              </Badge>
            )}
          </div>
          {achievement.rarity && achievement.rarity < 10 && (
            <Badge variant="outline" className="bg-purple-900 border-purple-700 text-purple-300 text-xs">
              Rare ({achievement.rarity.toFixed(1)}%)
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}