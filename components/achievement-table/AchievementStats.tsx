"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Database, CheckCircle, Target } from 'lucide-react';

interface AchievementStatsProps {
  total: number;
  completed: number;
  obtainable: number;
  completionRate: number;
  filtered: number;
}

export function AchievementStats({
  total,
  completed,
  obtainable,
  completionRate,
  filtered,
}: AchievementStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="compass-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-gold-400" />
          <span className="text-sm text-compass-300">Completion Rate</span>
        </div>
        <div className="text-2xl font-bold text-compass-100">{completionRate}%</div>
        <Progress value={completionRate} className="mt-2 h-2" />
      </Card>
      
      <Card className="compass-card p-4">
        <div className="text-sm text-compass-300 mb-2">Completed</div>
        <div className="text-2xl font-bold text-compass-100">{completed}</div>
        <div className="text-xs text-compass-400">of {total} total</div>
      </Card>
      
      <Card className="compass-card p-4">
        <div className="text-sm text-compass-300 mb-2">Obtainable</div>
        <div className="text-2xl font-bold text-compass-100">{obtainable}</div>
        <div className="text-xs text-compass-400">achievements available</div>
      </Card>
      
      <Card className="compass-card p-4">
        <div className="text-sm text-compass-300 mb-2">Filtered Results</div>
        <div className="text-2xl font-bold text-compass-100">{filtered}</div>
        <div className="text-xs text-compass-400">matching criteria</div>
      </Card>
    </div>
  );
}