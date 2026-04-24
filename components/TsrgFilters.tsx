"use client";

import { useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, SlidersHorizontal, Zap, Users, Timer } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from 'lucide-react';
import { UserPreferences } from "@/lib/types";
import { DEFAULT_PREFERENCES } from "@/lib/constants";

interface TSRGFiltersProps {
  filters: UserPreferences;
  onFiltersChange: (filters: UserPreferences) => void;
  filteredCount?: number;
  totalCount?: number;
}

const PRESETS: { label: string; icon: React.ReactNode; prefs: Partial<UserPreferences> }[] = [
  {
    label: "Solo Grinder",
    icon: <Timer className="h-3 w-3" />,
    prefs: { maxGroupScore: 3, maxTimeScore: 10, maxSkillScore: 10, maxRngScore: 10 },
  },
  {
    label: "Skill Check",
    icon: <Zap className="h-3 w-3" />,
    prefs: { maxSkillScore: 10, maxRngScore: 3, maxGroupScore: 10, maxTimeScore: 7 },
  },
  {
    label: "Group Ready",
    icon: <Users className="h-3 w-3" />,
    prefs: { maxGroupScore: 10, maxSkillScore: 8, maxTimeScore: 8, maxRngScore: 5 },
  },
];

export function TSRGFiltersComponent({ filters, onFiltersChange, filteredCount, totalCount }: TSRGFiltersProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handleSliderChange = useCallback((key: 'maxTimeScore' | 'maxSkillScore' | 'maxRngScore' | 'maxGroupScore', value: number[]) => {
    setActivePreset(null);
    onFiltersChange({ ...filters, [key]: value[0] });
  }, [filters, onFiltersChange]);

  const handleSwitchChange = useCallback((key: 'hideCompleted' | 'hideUnobtainable', checked: boolean) => {
    onFiltersChange({ ...filters, [key]: checked });
  }, [filters, onFiltersChange]);

  const handleTierToggle = useCallback((tier: number) => {
    setActivePreset(null);
    const newTiers = filters.selectedTiers.includes(tier)
      ? filters.selectedTiers.filter(t => t !== tier)
      : [...filters.selectedTiers, tier].sort((a, b) => a - b);
    onFiltersChange({ ...filters, selectedTiers: newTiers });
  }, [filters, onFiltersChange]);

  const applyPreset = useCallback((preset: typeof PRESETS[0]) => {
    setActivePreset(preset.label);
    onFiltersChange({ ...filters, ...preset.prefs });
  }, [filters, onFiltersChange]);

  const resetFilters = useCallback(() => {
    setActivePreset(null);
    onFiltersChange(DEFAULT_PREFERENCES);
  }, [onFiltersChange]);

  const isNonDefault = useMemo(() => {
    return (
      filters.maxTimeScore !== DEFAULT_PREFERENCES.maxTimeScore ||
      filters.maxSkillScore !== DEFAULT_PREFERENCES.maxSkillScore ||
      filters.maxRngScore !== DEFAULT_PREFERENCES.maxRngScore ||
      filters.maxGroupScore !== DEFAULT_PREFERENCES.maxGroupScore ||
      filters.hideCompleted !== DEFAULT_PREFERENCES.hideCompleted ||
      filters.hideUnobtainable !== DEFAULT_PREFERENCES.hideUnobtainable ||
      filters.selectedTiers.length !== DEFAULT_PREFERENCES.selectedTiers.length
    );
  }, [filters]);

  const getTierName = useMemo(() => (tier: number) => {
    switch (tier) {
      case 1: return 'Foundational';
      case 2: return 'Systematic';
      case 3: return 'Dedicated';
      case 4: return 'Apex';
      default: return `Tier ${tier}`;
    }
  }, []);

  const getTierColor = useMemo(() => (tier: number) => {
    switch (tier) {
      case 1: return 'tier-foundational';
      case 2: return 'tier-systematic';
      case 3: return 'tier-dedicated';
      case 4: return 'tier-apex';
      default: return 'bg-silver-500 hover:bg-silver-600 border-silver-400';
    }
  }, []);

  const sliders = [
    {
      key: 'maxTimeScore' as const,
      label: 'Time & Grind',
      value: filters.maxTimeScore,
      color: 'bg-gold-500',
      sliderColor: '[&_[role=slider]]:bg-gold-500 [&_[role=slider]]:border-gold-400',
      tooltip: 'How much time investment or grinding is required. Higher scores indicate achievements that take weeks or months to complete.',
      testId: 'time-slider',
    },
    {
      key: 'maxSkillScore' as const,
      label: 'Skill',
      value: filters.maxSkillScore,
      color: 'bg-compass-500',
      sliderColor: '[&_[role=slider]]:bg-compass-500 [&_[role=slider]]:border-compass-400',
      tooltip: 'Mechanical skill and execution required. Higher scores indicate achievements requiring precise timing, complex rotations, or advanced techniques.',
      testId: 'skill-slider',
    },
    {
      key: 'maxRngScore' as const,
      label: 'RNG',
      value: filters.maxRngScore,
      color: 'bg-earth-500',
      sliderColor: '[&_[role=slider]]:bg-earth-500 [&_[role=slider]]:border-earth-400',
      tooltip: 'Dependence on random chance or luck. Higher scores indicate achievements with rare drops, lottery systems, or unpredictable elements.',
      testId: 'rng-slider',
    },
    {
      key: 'maxGroupScore' as const,
      label: 'Group',
      value: filters.maxGroupScore,
      color: 'bg-silver-500',
      sliderColor: '[&_[role=slider]]:bg-silver-500 [&_[role=slider]]:border-silver-400',
      tooltip: 'Group coordination and dependency required. Higher scores indicate achievements needing organised teams, statics, or community coordination.',
      testId: 'group-slider',
    },
  ];

  return (
    <Card className="p-6 compass-card mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-compass-400" />
          <h3 className="text-base font-semibold text-compass-100">TSR-G Difficulty Filters</h3>
          {isNonDefault && (
            <Badge variant="outline" className="text-xs border-compass-600 text-compass-400 bg-compass-800/50 ml-1">
              Active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {filteredCount !== undefined && totalCount !== undefined && (
            <span className="text-xs text-compass-400">
              <span className="text-compass-200 font-medium">{filteredCount}</span>
              <span className="text-compass-500"> / {totalCount}</span>
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="text-compass-400 border-compass-700 hover:bg-compass-800 hover:text-compass-100 transition-all duration-200 h-7 px-2"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="mb-5">
        <p className="text-xs text-compass-500 mb-2 uppercase tracking-wider">Quick Presets</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
              className={`h-7 px-3 text-xs transition-all duration-200 ${
                activePreset === preset.label
                  ? 'bg-compass-700 border-compass-500 text-compass-100'
                  : 'border-compass-700 text-compass-400 hover:bg-compass-800 hover:text-compass-200'
              }`}
            >
              {preset.icon}
              <span className="ml-1">{preset.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sliders.map((slider) => (
            <div key={slider.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-compass-200 flex items-center gap-2 text-sm">
                  <span className={`w-2.5 h-2.5 ${slider.color} rounded-full flex-shrink-0`} />
                  {slider.label}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-compass-500 hover:text-compass-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-compass-800 border-compass-600 text-compass-100 z-tooltip">
                        <p>{slider.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <span className="text-xs text-compass-400 font-mono tabular-nums">
                  up to <span className="text-compass-200 font-semibold">{slider.value}</span>
                </span>
              </div>
              <Slider
                value={[slider.value]}
                onValueChange={(value) => handleSliderChange(slider.key, value)}
                max={10}
                min={1}
                step={1}
                className={`w-full ${slider.sliderColor} [&_[role=slider]]:transition-none`}
                data-testid={slider.testId}
              />
            </div>
          ))}
        </div>

        {/* Difficulty Tiers */}
        <div className="space-y-2">
          <Label className="text-compass-200 flex items-center gap-2 text-sm">
            Difficulty Tiers
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-compass-500 hover:text-compass-300 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm bg-compass-800 border-compass-600 text-compass-100 z-tooltip">
                  <div className="space-y-1">
                    <p><strong>Foundational:</strong> Basic milestones and story progress (4–12 pts)</p>
                    <p><strong>Systematic:</strong> Regular engagement and moderate effort (13–24 pts)</p>
                    <p><strong>Dedicated:</strong> Significant time investment and focus (25–32 pts)</p>
                    <p><strong>Apex:</strong> The most challenging achievements in the game (33–40 pts)</p>
                  </div>
                  <p className="text-compass-400 text-xs mt-2 border-t border-compass-700 pt-2">Click a tier to include or exclude it from results.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((tier) => (
              <Badge
                key={tier}
                variant={filters.selectedTiers.includes(tier) ? "default" : "outline"}
                className={`cursor-pointer transition-all duration-200 select-none ${
                  filters.selectedTiers.includes(tier)
                    ? getTierColor(tier) + ' text-white'
                    : 'border-compass-700 text-compass-500 hover:bg-compass-800 opacity-50'
                }`}
                onClick={() => handleTierToggle(tier)}
                data-testid={`tier-${tier}-badge`}
              >
                {getTierName(tier)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Toggle Switches */}
        <div className="space-y-3 pt-1 border-t border-compass-700/40">
          <div className="flex items-center justify-between">
            <Label htmlFor="hide-completed" className="text-compass-200 text-sm cursor-pointer">
              Hide Completed Achievements
            </Label>
            <Switch
              id="hide-completed"
              checked={filters.hideCompleted}
              onCheckedChange={(checked) => handleSwitchChange('hideCompleted', checked)}
              data-testid="hide-completed-switch"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="hide-unobtainable" className="text-compass-200 text-sm cursor-pointer">
              Hide Unobtainable Achievements
            </Label>
            <Switch
              id="hide-unobtainable"
              checked={filters.hideUnobtainable}
              onCheckedChange={(checked) => handleSwitchChange('hideUnobtainable', checked)}
              data-testid="hide-unobtainable-switch"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
