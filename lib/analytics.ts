import { useEffect } from 'react';
import { supabase } from './supabase';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: number;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = sessionStorage.getItem('ec_session_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('ec_session_id', id);
  }
  return id;
}

const eventQueue: Array<{ event_type: string; event_data: Record<string, unknown>; session_id: string }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushEvents() {
  if (eventQueue.length === 0) return;
  const batch = eventQueue.splice(0, eventQueue.length);
  try {
    await supabase.from('analytics_events').insert(batch);
  } catch {
    eventQueue.unshift(...batch);
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushEvents();
  }, 5000);
}

class Analytics {
  private events: AnalyticsEvent[] = [];

  track(eventName: string, properties?: Record<string, unknown>) {
    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
    };
    this.events.push(event);

    if (typeof window !== 'undefined') {
      eventQueue.push({
        event_type: eventName,
        event_data: properties || {},
        session_id: getSessionId(),
      });
      scheduleFlush();
    }
  }

  trackPerformance(metricName: string, value: number) {
    this.track('performance', { metric: metricName, value });
  }

  trackWebVitals() {
    if (typeof window === 'undefined') return;

    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackPerformance('LCP', lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const eventEntry = entry as PerformanceEventTiming;
          this.trackPerformance('FID', eventEntry.processingStart - eventEntry.startTime);
        });
      }).observe({ entryTypes: ['first-input'] });

      let clsValue = 0;
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.trackPerformance('CLS', clsValue);
      }).observe({ entryTypes: ['layout-shift'] });
    } catch {
      // PerformanceObserver not supported
    }
  }

  trackCharacterSearch(characterName: string, server: string, success: boolean) {
    this.track('search', { character_name: characterName, server, success });
  }

  trackFilterUsage(filterType: string, value: unknown) {
    this.track('filter', { filter_type: filterType, value });
  }

  trackAchievementView(achievementId: number, achievementName: string) {
    this.track('achievement_view', { achievement_id: achievementId, achievement_name: achievementName });
  }

  trackRecommendationClick(achievementId: number, recommendationScore: number) {
    this.track('recommendation_click', { achievement_id: achievementId, recommendation_score: recommendationScore });
  }

  trackProjectView(projectId: string, projectName: string) {
    this.track('project_view', { project_id: projectId, project_name: projectName });
  }

  trackError(error: string, context?: string) {
    this.track('error', { error, context });
  }

  trackPageView(path: string) {
    this.track('page_view', { path });
  }
}

export const analytics = new Analytics();

export function useAnalytics() {
  useEffect(() => {
    analytics.trackWebVitals();
    analytics.trackPageView(window.location.pathname);

    return () => {
      flushEvents();
    };
  }, []);

  return {
    track: analytics.track.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackCharacterSearch: analytics.trackCharacterSearch.bind(analytics),
    trackFilterUsage: analytics.trackFilterUsage.bind(analytics),
    trackAchievementView: analytics.trackAchievementView.bind(analytics),
    trackRecommendationClick: analytics.trackRecommendationClick.bind(analytics),
    trackProjectView: analytics.trackProjectView.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
  };
}
