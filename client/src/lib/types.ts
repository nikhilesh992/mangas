export interface Manga {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  status: string;
  year: number;
  contentRating: string;
  genres: string[];
  authors: Array<{ id: string; name: string; type: string }>;
  updatedAt: string;
  latestChapter?: string;
  availableLanguages?: string[];
}

export interface Chapter {
  id: string;
  mangaId?: string;
  volume: string;
  chapter: string;
  title: string;
  language: string;
  pages: number;
  publishAt: string;
  readableAt: string;
  images?: string[];
  baseUrl?: string;
}

export interface MangaSearchParams {
  search?: string;
  tags?: string[];
  excludedTags?: string[];
  status?: string[];
  contentRating?: string[];
  publicationDemographic?: string[];
  originalLanguage?: string[];
  translatedLanguage?: string[];
  year?: number;
  limit?: number;
  offset?: number;
  order?: string;
  source?: 'mangadx' | 'mangaplus' | 'all';
}

export interface MangaListResponse {
  data: Manga[];
  total: number;
  offset: number;
}

export interface AnalyticsEvent {
  id: string;
  mangaId: string;
  mangaTitle: string;
  eventType: 'view' | 'impression' | 'click' | 'read';
  page: 'home' | 'detail' | 'reader' | 'search';
  userId?: string;
  sessionId: string;
  timestamp: string;
  metadata?: {
    duration?: number;
    chapterId?: string;
    searchQuery?: string;
    position?: number;
  };
}

export interface MangaAnalytics {
  mangaId: string;
  mangaTitle: string;
  totalViews: number;
  totalImpressions: number;
  totalClicks: number;
  totalReads: number;
  uniqueViewers: number;
  avgViewDuration: number;
  popularChapters: Array<{
    chapterId: string;
    chapterNumber: string;
    views: number;
  }>;
  viewsByPage: {
    home: number;
    detail: number;
    reader: number;
    search: number;
  };
  dailyStats: Array<{
    date: string;
    views: number;
    impressions: number;
  }>;
}

export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  mangaId?: string;
  eventType?: string[];
  page?: string[];
  limit?: number;
  offset?: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  category?: string;
  tags: string[];
  authorId: string;
  published: boolean;
  publishedAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFavorite {
  id: string;
  userId: string;
  mangaId: string;
  mangaTitle?: string;
  mangaCover?: string;
  createdAt: string;
}

export interface ReadingProgress {
  id: string;
  userId: string;
  mangaId: string;
  chapterId: string;
  pageNumber: number;
  totalPages?: number;
  completed: boolean;
  updatedAt: string;
}

export interface ApiConfiguration {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  priority: number;
  endpoints: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

// Unified Ad interface (replaces AdNetwork and CustomBanner)
export interface Ad {
  id: number;
  networkName?: string;
  adScript?: string;
  bannerImage?: string;
  bannerLink?: string;
  width?: number;
  height?: number;
  slots: string[];
  enabled: boolean;
  createdAt: string;
}

// Legacy interfaces (for backward compatibility)
export interface AdNetwork {
  id: string;
  name: string;
  script: string;
  enabled: boolean;
  slots: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomBanner {
  id: string;
  name: string;
  imageUrl: string;
  linkUrl?: string;
  positions: string[];
  startDate?: string;
  endDate?: string;
  impressions: number;
  clicks: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value?: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export interface DashboardStats {
  totalViews: number;
  activeUsers: number;
  adRevenue: number;
  blogPosts: number;
  totalManga: number;
  totalChapters: number;
}
