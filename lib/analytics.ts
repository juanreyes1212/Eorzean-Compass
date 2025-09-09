// Analytics and performance monitoring for production
import { useEffect } from 'react';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private metrics: PerformanceMetric[] = [];
  private isProduction = process.env.NODE_ENV === 'production';

  // Track user events
  track(eventName: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
    };

    this.events.push(event);

    if (this.isProduction) {
      // In production, you would send to your analytics service
      console.log('Analytics Event:', event);
    } else {
      console.log('Analytics Event (Dev):', event);
    }
  }

  // Track performance metrics
  trackPerformance(metricName: string, value: number) {
    const metric: PerformanceMetric = {
      name: metricName,
      value,
      timestamp: Date.now(),
      url: window.location.href,
    };

    this.metrics.push(metric);

    if (this.isProduction) {
      // Send to performance monitoring service
      console.log('Performance Metric:', metric);
    }
  }

  // Track Core Web Vitals
  trackWebVitals() {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.trackPerformance('LCP', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const eventEntry = entry as PerformanceEventTiming;
        this.trackPerformance('FID', eventEntry.processingStart - eventEntry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.trackPerformance('CLS', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  // Track user interactions
  trackCharacterSearch(characterName: string, server: string, success: boolean) {
    this.track('character_search', {
      character_name: characterName,
      server,
      success,
    });
  }

  trackFilterUsage(filterType: string, value: any) {
    this.track('filter_usage', {
      filter_type: filterType,
      value,
    });
  }

  trackAchievementView(achievementId: number, achievementName: string) {
    this.track('achievement_view', {
      achievement_id: achievementId,
      achievement_name: achievementName,
    });
  }

  trackRecommendationClick(achievementId: number, recommendationScore: number) {
    this.track('recommendation_click', {
      achievement_id: achievementId,
      recommendation_score: recommendationScore,
    });
  }

  trackProjectView(projectId: string, projectName: string) {
    this.track('project_view', {
      project_id: projectId,
      project_name: projectName,
    });
  }

  // Get analytics summary
  getEventsSummary() {
    return {
      totalEvents: this.events.length,
      eventTypes: [...new Set(this.events.map(e => e.name))],
      recentEvents: this.events.slice(-10),
    };
  }

  getPerformanceSummary() {
    return {
      totalMetrics: this.metrics.length,
      averageLoadTime: this.getAverageMetric('load_time'),
      averageLCP: this.getAverageMetric('LCP'),
      averageFID: this.getAverageMetric('FID'),
      averageCLS: this.getAverageMetric('CLS'),
    };
  }

  private getAverageMetric(name: string): number {
    const metrics = this.metrics.filter(m => m.name === name);
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }
}

// Export singleton instance
export const analytics = new Analytics();

// React hook for analytics
export function useAnalytics() {
  useEffect(() => {
    analytics.trackWebVitals();
  }, []);

  return {
    track: analytics.track.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackCharacterSearch: analytics.trackCharacterSearch.bind(analytics),
    trackFilterUsage: analytics.trackFilterUsage.bind(analytics),
    trackAchievementView: analytics.trackAchievementView.bind(analytics),
    trackRecommendationClick: analytics.trackRecommendationClick.bind(analytics),
    trackProjectView: analytics.trackProjectView.bind(analytics),
  };
}