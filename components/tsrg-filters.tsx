"use client";

import { useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from 'lucide-react';

export interface TSRGFilters {
  maxTime: number;
  maxSkill: number;
  maxRng: number;
  maxGroup: number;
  hideCompleted: boolean;
  hideUnobtainable: boolean;
  selectedTiers: number[];
}

interface TSRGFiltersProps {
  filters: TSRGFilters;
  onFiltersChange: (filters: TSRGFilters) => void;
}

const DEFAULT_FILTERS: TSRGFilters = {
  maxTime: 10,
  maxSkill: 10,
  maxRng: 10,
  maxGroup: 10,
  hideCompleted: false,
  hideUnobtainable: true,
  selectedTiers: [1, 2, 3, 4],
};

export function TSRGFiltersComponent({ filters, onFiltersChange }: TSRGFiltersProps) {
  // Optimized slider change handler with useCallback
  const handleSliderChange = useCallback((key: keyof TSRGFilters, value: number[]) => {
    onFiltersChange({
      ...filters,
      [key]: value[0],
    });
  }, [filters, onFiltersChange]);

  // Optimized switch change handler
  const handleSwitchChange = useCallback((key: keyof TSRGFilters, checked: boolean) => {
    onFiltersChange({
      ...filters,
      [key]: checked,
    });
  }, [filters, onFiltersChange]);

  // Optimized tier toggle handler
  const handleTierToggle = useCallback((tier: number) => {
    const newTiers = filters.selectedTiers.includes(tier)
      ? filters.selectedTiers.filter(t => t !== tier)
      : [...filters.selectedTiers, tier].sort();
    
    onFiltersChange({
      ...filters,
      selectedTiers: newTiers,
    });
  }, [filters, onFiltersChange]);

  const resetFilters = useCallback(() => {
    onFiltersChange(DEFAULT_FILTERS);
  }, [onFiltersChange]);

  // Memoized tier utilities
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
      case 1: return 'bg-earth-600 hover:bg-earth-700 border-earth-500';
      case 2: return 'bg-compass-600 hover:bg-compass-700 border-compass-500';
      case 3: return 'bg-gold-600 hover:bg-gold-700 border-gold-500';
      case 4: return 'bg-gradient-to-r from-gold-500 to-compass-600 hover:from-gold-600 hover:to-compass-700 border-gold-500';
      default: return 'bg-silver-500 hover:bg-silver-600 border-silver-400';
    }
  }, []);

  return (
    <Card className="p-6 compass-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-compass-100">TSR-G Difficulty Filters</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
          className="text-compass-300 border-compass-600 hover:bg-compass-700 hover:text-compass-100"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="space-y-6">
        {/* Difficulty Vector Sliders - Optimized for performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-compass-100 flex items-center gap-2">
              <span className="w-3 h-3 bg-gold-500 rounded"></span>
              Time/Grind (Max: {filters.maxTime})
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-compass-400 hover:text-compass-300 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-compass-800 border-compass-600 text-compass-100 z-tooltip">
                    <p>How much time investment or grinding is required. Higher scores indicate achievements that take weeks or months to complete.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Slider
              value={[filters.maxTime]}
              onValueChange={(value) => handleSliderChange('maxTime', value)}
              max={10}
              min={1}
              step={1}
              className="w-full [&_[role=slider]]:bg-gold-500 [&_[role=slider]]:border-gold-400 [&_[role=slider]]:transition-none"
              data-testid="time-slider"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-compass-100 flex items-center gap-2">
              <span className="w-3 h-3 bg-compass-500 rounded"></span>
              Skill (Max: {filters.maxSkill})
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-compass-400 hover:text-compass-300 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-compass-800 border-compass-600 text-compass-100 z-tooltip">
                    <p>Mechanical skill and execution required. Higher scores indicate achievements requiring precise timing, complex rotations, or advanced techniques.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Slider
              value={[filters.maxSkill]}
              onValueChange={(value) => handleSliderChange('maxSkill', value)}
              max={10}
              min={1}
              step={1}
              className="w-full [&_[role=slider]]:bg-compass-500 [&_[role=slider]]:border-compass-400 [&_[role=slider]]:transition-none"
              data-testid="skill-slider"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-compass-100 flex items-center gap-2">
              <span className="w-3 h-3 bg-earth-500 rounded"></span>
              RNG (Max: {filters.maxRng})
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-compass-400 hover:text-compass-300 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-compass-800 border-compass-600 text-compass-100 z-tooltip">
                    <p>Dependence on random chance or luck. Higher scores indicate achievements with rare drops, lottery systems, or unpredictable elements.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Slider
              value={[filters.maxRng]}
              onValueChange={(value) => handleSliderChange('maxRng', value)}
              max={10}
              min={1}
              step={1}
              className="w-full [&_[role=slider]]:bg-earth-500 [&_[role=slider]]:border-earth-400 [&_[role=slider]]:transition-none"
              data-testid="rng-slider"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-compass-100 flex items-center gap-2">
              <span className="w-3 h-3 bg-silver-500 rounded"></span>
              Group (Max: {filters.maxGroup})
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-compass-400 hover:text-compass-300 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-compass-800 border-compass-600 text-compass-100 z-tooltip">
                    <p>Group coordination and dependency required. Higher scores indicate achievements needing organized teams, statics, or community coordination.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Slider
              value={[filters.maxGroup]}
              onValueChange={(value) => handleSliderChange('maxGroup', value)}
              max={10}
              min={1}
              step={1}
              className="w-full [&_[role=slider]]:bg-silver-500 [&_[role=slider]]:border-silver-400 [&_[role=slider]]:transition-none"
              data-testid="group-slider"
            />
          </div>
        </div>

        {/* Difficulty Tiers */}
        <div className="space-y-2">
          <Label className="text-compass-100 flex items-center gap-2">
            Difficulty Tiers
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-compass-400 hover:text-compass-300 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm bg-compass-800 border-compass-600 text-compass-100 z-tooltip">
                  <div className="space-y-1">
                    <p><strong>Foundational:</strong> Basic milestones and story progress</p>
                    <p><strong>Systematic:</strong> Regular engagement and moderate effort</p>
                    <p><strong>Dedicated:</strong> Significant time investment and focus</p>
                    <p><strong>Apex:</strong> The most challenging achievements in the game</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((tier) => (
              <Badge
                key={tier}
                variant={filters.selectedTiers.includes(tier) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  filters.selectedTiers.includes(tier)
                    ? getTierColor(tier) + ' text-white'
                    : 'border-compass-600 text-compass-300 hover:bg-compass-700'
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="hide-completed" className="text-compass-100">
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
            <Label htmlFor="hide-unobtainable" className="text-compass-100">
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
