import type { AnalyticsEvent } from './types';
import { apiRequest } from './queryClient';

class AnalyticsService {
  private sessionId: string;
  private userId?: string;
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.userId = this.getCurrentUserId();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private getCurrentUserId(): string | undefined {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  async trackEvent(
    mangaId: string,
    mangaTitle: string,
    eventType: AnalyticsEvent['eventType'],
    page: AnalyticsEvent['page'],
    metadata?: AnalyticsEvent['metadata']
  ): Promise<void> {
    const event: Omit<AnalyticsEvent, 'id'> = {
      mangaId,
      mangaTitle,
      eventType,
      page,
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      metadata
    };

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.warn('Failed to track analytics event:', error);
    }
  }

  // Track manga view (when user visits manga detail page)
  trackMangaView(mangaId: string, mangaTitle: string, page: AnalyticsEvent['page'] = 'detail'): void {
    this.trackEvent(mangaId, mangaTitle, 'view', page);
  }

  // Track manga impression (when manga appears in viewport on home page)
  trackMangaImpression(mangaId: string, mangaTitle: string, position?: number): void {
    this.trackEvent(mangaId, mangaTitle, 'impression', 'home', { position });
  }

  // Track manga click (when user clicks on manga card)
  trackMangaClick(mangaId: string, mangaTitle: string, page: AnalyticsEvent['page'] = 'home'): void {
    this.trackEvent(mangaId, mangaTitle, 'click', page);
  }

  // Track chapter read (when user starts reading a chapter)
  trackChapterRead(mangaId: string, mangaTitle: string, chapterId: string, duration?: number): void {
    this.trackEvent(mangaId, mangaTitle, 'read', 'reader', { chapterId, duration });
  }

  // Track search result impression
  trackSearchImpression(mangaId: string, mangaTitle: string, searchQuery: string, position: number): void {
    this.trackEvent(mangaId, mangaTitle, 'impression', 'search', { searchQuery, position });
  }

  // New page view tracking for general analytics
  async trackPageView(path: string, referrer?: string): Promise<void> {
    if (typeof window === 'undefined') return; // Skip on server-side

    try {
      await apiRequest('POST', '/api/analytics/pageview', {
        path,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        referrer: referrer || document.referrer,
        ipAddress: '', // Will be filled by server from request
      });
    } catch (error) {
      console.warn('Failed to track page view:', error);
    }
  }

  // Track ad click for revenue analytics
  async trackAdClick(adId: number, position: string, path: string): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      await apiRequest('POST', '/api/analytics/adclick', {
        adId,
        sessionId: this.sessionId,
        position,
        path,
      });
    } catch (error) {
      console.warn('Failed to track ad click:', error);
    }
  }

  // Queue analytics calls to avoid blocking UI
  queueTracking(trackingFn: () => Promise<void>): void {
    this.queue.push(trackingFn);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    while (this.queue.length > 0) {
      const trackingFn = this.queue.shift();
      if (trackingFn) {
        try {
          await trackingFn();
        } catch (error) {
          console.warn('Analytics tracking failed:', error);
        }
      }
    }
    this.isProcessing = false;
  }

  // Track page view with automatic path detection
  trackCurrentPage(): void {
    if (typeof window !== 'undefined') {
      this.queueTracking(() => this.trackPageView(window.location.pathname));
    }
  }

  // Get current session ID for external use
  getSessionId(): string {
    return this.sessionId;
  }
}

export const analytics = new AnalyticsService();
