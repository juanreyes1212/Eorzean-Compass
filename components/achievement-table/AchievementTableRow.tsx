"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AchievementIcon, getAchievementIconUrl } from "@/components/achievement-icon";
import { getTierName, getTierColor } from "@/lib/tsrg-matrix";
import { CheckCircle, Clock, Zap, Dice6, Users } from 'lucide-react';
import { AchievementWithTSRG } from "@/lib/types";
import { getAriaLabel } from "@/lib/utils/accessibility";

interface AchievementTableRowProps {
  achievement: AchievementWithTSRG;
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

export function AchievementTableRow({ achievement }: AchievementTableRowProps) {
  return (
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
      aria-label={getAriaLabel(achievement)}
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
  );
}