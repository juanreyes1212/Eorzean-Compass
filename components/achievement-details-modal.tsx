"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AchievementIcon, getAchievementIconUrl } from "@/components/achievement-icon";
import { getTierName, getTierColor, getVectorName, getVectorColor } from "@/lib/tsrg-matrix";
import { Clock, Zap, Dice6, Users, Info } from 'lucide-react';
import { AchievementWithTSRG } from "@/lib/types";

interface AchievementDetailsModalProps {
  achievement: AchievementWithTSRG | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AchievementDetailsModal({ achievement, isOpen, onClose }: AchievementDetailsModalProps) {
  if (!achievement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-compass-800 border-compass-700 p-6 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-compass-100 flex items-center gap-3">
            <AchievementIcon icon={getAchievementIconUrl(achievement.icon)} name={achievement.name} size="lg" />
            {achievement.name}
          </DialogTitle>
          <DialogDescription className="text-compass-300 mt-2">
            {achievement.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Basic Info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-compass-700/50 text-compass-300 border-compass-600">
              {achievement.category}
            </Badge>
            <Badge className={`${getTierColor(achievement.tsrg.tier)} text-white`}>
              {getTierName(achievement.tsrg.tier)}
            </Badge>
            <Badge variant="outline" className="bg-compass-700/50 text-compass-300 border-compass-600">
              {achievement.points} Points
            </Badge>
            {!achievement.isObtainable && (
              <Badge variant="destructive" className="bg-red-900/50 border-red-700 text-red-300">
                Unobtainable
              </Badge>
            )}
            {achievement.rarity && achievement.rarity < 10 && (
              <Badge variant="outline" className="bg-purple-900/50 border-purple-700 text-purple-300">
                Rare ({achievement.rarity.toFixed(1)}%)
              </Badge>
            )}
          </div>

          {/* TSR-G Scores */}
          <div>
            <h4 className="font-medium text-compass-200 mb-2">TSR-G Difficulty:</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className={`h-4 w-4 ${getVectorColor('time', achievement.tsrg.time)}`} />
                <span className="text-compass-100">{getVectorName('time')}:</span>
                <span className="font-semibold text-compass-100">{achievement.tsrg.time}/10</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className={`h-4 w-4 ${getVectorColor('skill', achievement.tsrg.skill)}`} />
                <span className="text-compass-100">{getVectorName('skill')}:</span>
                <span className="font-semibold text-compass-100">{achievement.tsrg.skill}/10</span>
              </div>
              <div className="flex items-center gap-2">
                <Dice6 className={`h-4 w-4 ${getVectorColor('rng', achievement.tsrg.rng)}`} />
                <span className="text-compass-100">{getVectorName('rng')}:</span>
                <span className="font-semibold text-compass-100">{achievement.tsrg.rng}/10</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className={`h-4 w-4 ${getVectorColor('group', achievement.tsrg.group)}`} />
                <span className="text-compass-100">{getVectorName('group')}:</span>
                <span className="font-semibold text-compass-100">{achievement.tsrg.group}/10</span>
              </div>
            </div>
            <div className="text-sm text-compass-400 mt-2">
              Composite Score: <span className="font-semibold">{achievement.tsrg.composite}</span>
            </div>
          </div>

          {/* How to Get */}
          <div>
            <h4 className="font-medium text-compass-200 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-gold-400" />
              How to Get This Achievement:
            </h4>
            <p className="text-sm text-compass-300">
              {achievement.description}
              <br/><br/>
              For detailed guides, please refer to community resources like FFXIV Collect, XIVAPI, or your favorite FFXIV content creators.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}