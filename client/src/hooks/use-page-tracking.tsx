import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { analytics } from '@/lib/analytics';

export function usePageTracking() {
  const [location] = useLocation();

  useEffect(() => {
    // Track page view whenever location changes
    if (location) {
      analytics.queueTracking(() => analytics.trackPageView(location));
    }
  }, [location]);

  return {
    trackCurrentPage: () => analytics.trackCurrentPage(),
    trackCustomEvent: (path: string, referrer?: string) => 
      analytics.queueTracking(() => analytics.trackPageView(path, referrer)),
  };
}

// Auto-tracking component that can be placed anywhere in the app
export function PageTracker() {
  usePageTracking();
  return null; // This component only tracks, doesn't render anything
}