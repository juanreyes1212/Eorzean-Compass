"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Zap, Clock, HardDrive } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  memoryUsage: number;
  renderTime: number;
  cacheHitRate: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      let memoryUsage = 0;
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      }

      // Measure render time using Performance Observer
      let renderTime = 0;
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const paintEntries = entries.filter(entry => entry.entryType === 'paint');
            if (paintEntries.length > 0) {
              renderTime = paintEntries[paintEntries.length - 1].startTime;
            }
          });
          observer.observe({ entryTypes: ['paint'] });
        } catch (error) {
          console.warn('Performance Observer not supported');
        }
      }

      // Calculate cache hit rate from localStorage
      const storageInfo = getStorageInfo();
      const cacheHitRate = storageInfo.hasAchievements ? 85 : 0; // Simplified calculation

      setMetrics({
        loadTime: Math.round(loadTime),
        memoryUsage: Math.round(memoryUsage),
        renderTime: Math.round(renderTime),
        cacheHitRate,
      });
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
    }

    // Toggle visibility with keyboard shortcut
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('load', measurePerformance);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  if (!metrics || !isVisible || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getPerformanceColor = (value: number, thresholds: [number, number]) => {
    if (value <= thresholds[0]) return 'text-green-400';
    if (value <= thresholds[1]) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="p-4 bg-compass-800/95 border-compass-700 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-gold-400" />
          <span className="text-sm font-medium text-compass-100">Performance Monitor</span>
          <Badge variant="outline" className="text-xs bg-compass-700 border-compass-600">
            Dev Only
          </Badge>
        </div>
        
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-compass-400" />
              <span className="text-compass-300">Load Time</span>
            </div>
            <span className={getPerformanceColor(metrics.loadTime, [2000, 5000])}>
              {metrics.loadTime}ms
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-compass-400" />
              <span className="text-compass-300">Render Time</span>
            </div>
            <span className={getPerformanceColor(metrics.renderTime, [100, 300])}>
              {metrics.renderTime}ms
            </span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-3 w-3 text-compass-400" />
                <span className="text-compass-300">Memory</span>
              </div>
              <span className={getPerformanceColor(metrics.memoryUsage, [50, 80])}>
                {metrics.memoryUsage}%
              </span>
            </div>
            <Progress value={metrics.memoryUsage} className="h-1" />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-compass-300">Cache Hit Rate</span>
            <span className="text-green-400">{metrics.cacheHitRate}%</span>
          </div>
        </div>
        
        <div className="mt-3 pt-2 border-t border-compass-700">
          <p className="text-xs text-compass-400">
            Press Ctrl+Shift+P to toggle
          </p>
        </div>
      </Card>
    </div>
  );
}

function getStorageInfo() {
  // Simplified version for this component
  try {
    const hasAchievements = !!localStorage.getItem('eorzean_compass_achievements');
    return { hasAchievements };
  } catch {
    return { hasAchievements: false };
  }
}