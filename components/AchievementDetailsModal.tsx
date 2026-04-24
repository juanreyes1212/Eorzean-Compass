"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AchievementIcon, getAchievementIconUrl } from "@/components/AchievementIcon";
import { getTierName, getTierColor, getVectorName, getVectorColor } from "@/lib/tsrg-matrix";
import { Clock, Zap, Dice6, Users, ExternalLink } from 'lucide-react';
import { AchievementWithTSRG } from "@/lib/types";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

interface AchievementDetailsModalProps {
  achievement: AchievementWithTSRG | null;
  isOpen: boolean;
  onClose: () => void;
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-1.5 bg-compass-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
      <span className="text-xs text-compass-400 font-mono tabular-nums w-8 text-right">{value}/10</span>
    </div>
  );
}

export function AchievementDetailsModal({ achievement, isOpen, onClose }: AchievementDetailsModalProps) {
  if (!achievement) return null;

  const radarData = [
    { axis: "Time", value: achievement.tsrg.time, fullMark: 10 },
    { axis: "Skill", value: achievement.tsrg.skill, fullMark: 10 },
    { axis: "RNG", value: achievement.tsrg.rng, fullMark: 10 },
    { axis: "Group", value: achievement.tsrg.group, fullMark: 10 },
  ];

  const vectorRows = [
    { icon: <Clock className="h-4 w-4" />, label: "Time", value: achievement.tsrg.time, colorClass: "text-gold-400", barColor: "bg-gold-500" },
    { icon: <Zap className="h-4 w-4" />, label: "Skill", value: achievement.tsrg.skill, colorClass: "text-compass-400", barColor: "bg-compass-500" },
    { icon: <Dice6 className="h-4 w-4" />, label: "RNG", value: achievement.tsrg.rng, colorClass: "text-earth-400", barColor: "bg-earth-500" },
    { icon: <Users className="h-4 w-4" />, label: "Group", value: achievement.tsrg.group, colorClass: "text-silver-400", barColor: "bg-silver-500" },
  ];

  const ffxivCollectUrl = `https://ffxivcollect.com/achievements/${achievement.id}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-compass-900 border-compass-700 p-6 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-compass-100 flex items-center gap-3">
            <AchievementIcon icon={getAchievementIconUrl(achievement.icon)} name={achievement.name} size="lg" />
            <span className="leading-snug">{achievement.name}</span>
          </DialogTitle>
          <DialogDescription className="text-compass-300 mt-1 leading-relaxed">
            {achievement.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-3">
          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-compass-700/40 text-compass-300 border-compass-600/60">
              {achievement.category}
            </Badge>
            <Badge className={`${getTierColor(achievement.tsrg.tier)} text-white`}>
              {getTierName(achievement.tsrg.tier)}
            </Badge>
            <Badge variant="outline" className="bg-compass-700/40 text-compass-300 border-compass-600/60">
              {achievement.points} pts
            </Badge>
            {!achievement.isObtainable && (
              <Badge variant="outline" className="bg-compass-800/60 border-compass-600 text-compass-400">
                Unavailable
              </Badge>
            )}
            {achievement.rarity && achievement.rarity < 10 && (
              <Badge variant="outline" className="bg-earth-900/50 border-earth-600/60 text-earth-300">
                Rare — {achievement.rarity.toFixed(1)}%
              </Badge>
            )}
          </div>

          {/* TSR-G Section: radar + score bars side by side */}
          <div>
            <h4 className="font-medium text-compass-200 mb-3 text-sm uppercase tracking-wide">TSR-G Difficulty Profile</h4>
            <div className="flex gap-4 items-center">
              {/* Radar chart */}
              <div className="w-32 h-32 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <PolarGrid stroke="rgba(13,126,160,0.25)" />
                    <PolarAngleAxis
                      dataKey="axis"
                      tick={{ fill: "#67d6f0", fontSize: 9, fontFamily: "var(--font-inter)" }}
                    />
                    <Radar
                      name="score"
                      dataKey="value"
                      stroke="#fbbf24"
                      fill="#fbbf24"
                      fillOpacity={0.18}
                      strokeWidth={1.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Score bars */}
              <div className="flex-1 space-y-3">
                {vectorRows.map((row) => (
                  <div key={row.label} className="flex items-center gap-2">
                    <span className={`${row.colorClass} flex-shrink-0`}>{row.icon}</span>
                    <span className="text-xs text-compass-300 w-9 flex-shrink-0">{row.label}</span>
                    <ScoreBar value={row.value} color={row.barColor} />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-compass-400 border-t border-compass-700/40 pt-2">
              <span>Composite score</span>
              <span className="font-mono font-semibold text-compass-200">{achievement.tsrg.composite} / 40</span>
            </div>
          </div>

          {/* External link */}
          <a
            href={ffxivCollectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-compass-400 hover:text-compass-200 transition-colors duration-200 group"
          >
            <ExternalLink className="h-3 w-3 group-hover:text-gold-400 transition-colors" />
            View on FFXIVCollect for guides and drop info
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
