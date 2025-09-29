import { apiRequest } from "./queryClient";
import type { 
  Manga, Chapter, MangaSearchParams, MangaListResponse, BlogPost, User, 
  UserFavorite, ReadingProgress, ApiConfiguration, 
  Ad, AdNetwork, CustomBanner, SiteSetting, DashboardStats,
  AnalyticsEvent, AnalyticsFilters
} from "./types";

// Auth API
export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    return response.json();
  },

  register: async (userData: { username: string; email: string; password: string; role?: string }) => {
    const response = await apiRequest("POST", "/api/auth/register", userData);
    return response.json();
  },

  getProfile: async () => {
    const response = await apiRequest("GET", "/api/auth/me");
  }
};

// Manga API
export const mangaApi = {
  getMangaList: async (params: MangaSearchParams = {}): Promise<MangaListResponse> => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });


    const response = await fetch(`/api/manga?${searchParams}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch manga: ${response.statusText}`);
    }
    
    return response.json();
  },

  searchManga: async (query: string, params: MangaSearchParams = {}) => {
    return mangaApi.getMangaList({ ...params, search: query });
  },

  getMangaById: async (id: string): Promise<Manga> => {
    const response = await apiRequest("GET", `/api/manga/${id}`);
    return response.json();
  },

  getChapters: async (mangaId: string, params: {
    limit?: number;
    offset?: number; 
    translatedLanguage?: string[] 
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(`${key}[]`, v));
      } else if (value !== undefined) {
        searchParams.set(key, value.toString());
      }
    });

    const response = await apiRequest("GET", `/api/manga/${mangaId}/chapters?${searchParams}`);
    return response.json();
  },

  getChapter: async (chapterId: string): Promise<Chapter> => {
    const response = await apiRequest("GET", `/api/chapter/${chapterId}`);
    return response.json();
  },

  getTags: async () => {
    const response = await apiRequest("GET", "/api/tags");
    return response.json();
  },
};

// User favorites API
export const favoritesApi = {
  getFavorites: async (): Promise<UserFavorite[]> => {
    const response = await apiRequest("GET", "/api/favorites");
    return response.json();
  },

  addFavorite: async (favorite: { mangaId: string; mangaTitle?: string; mangaCover?: string }) => {
    const response = await apiRequest("POST", "/api/favorites", favorite);
    return response.json();
  },

  removeFavorite: async (mangaId: string) => {
    await apiRequest("DELETE", `/api/favorites/${mangaId}`);
  },
};

// Reading progress API
export const progressApi = {
  getProgress: async (): Promise<ReadingProgress[]> => {
    const response = await apiRequest("GET", "/api/reading-progress");
    return response.json();
  },

  updateProgress: async (progress: {
    mangaId: string;
    chapterId: string;
    pageNumber: number;
    totalPages?: number;
    completed?: boolean;
  }) => {
    const response = await apiRequest("POST", "/api/reading-progress", progress);
    return response.json();
  },
};

// Blog API
export const blogApi = {
  getPosts: async (params: { limit?: number; offset?: number; search?: string } = {}): Promise<BlogPost[]> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, value.toString());
      }
    });

    const response = await apiRequest("GET", `/api/blog?${searchParams}`);
    return response.json();
  },

  getPostBySlug: async (slug: string): Promise<BlogPost> => {
    const response = await apiRequest("GET", `/api/blog/${slug}`);
    return response.json();
  },
};

// Ads API
export const adsApi = {
  getAdNetworks: async (): Promise<AdNetwork[]> => {
    const response = await apiRequest("GET", "/api/ads/networks");
    return response.json();
  },

  getBanners: async (position?: string): Promise<CustomBanner[]> => {
    const url = position ? `/api/ads/banners?position=${position}` : "/api/ads/banners";
    const response = await apiRequest("GET", url);
    return response.json();
  },

  trackBannerClick: async (bannerId: string) => {
    await apiRequest("POST", `/api/banners/${bannerId}/click`);
  },
};

// Admin API
export const adminApi = {
  // Dashboard
  getStats: async (timeRange?: string): Promise<DashboardStats> => {
    const url = timeRange ? `/api/admin/stats?timeRange=${timeRange}` : "/api/admin/stats";
    const response = await apiRequest("GET", url);
    return response.json();
  },

  // Analytics Overview
  getAnalyticsOverview: async (timeRange: string = '7d') => {
    const response = await apiRequest("GET", `/api/admin/analytics/overview?timeRange=${timeRange}`);
    return response.json();
  },

  // Blog management
  getAllBlogPosts: async (params: { limit?: number; offset?: number } = {}): Promise<BlogPost[]> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, value.toString());
      }
    });

    const response = await apiRequest("GET", `/api/admin/blog?${searchParams}`);
    return response.json();
  },

  createBlogPost: async (post: Partial<BlogPost>) => {
    const response = await apiRequest("POST", "/api/admin/blog", post);
    return response.json();
  },

  updateBlogPost: async (id: string, updates: Partial<BlogPost>) => {
    const response = await apiRequest("PUT", `/api/admin/blog/${id}`, updates);
    return response.json();
  },

  deleteBlogPost: async (id: string) => {
    await apiRequest("DELETE", `/api/admin/blog/${id}`);
  },

  // API Configuration
  getApiConfigurations: async (): Promise<ApiConfiguration[]> => {
    const response = await apiRequest("GET", "/api/admin/api-config");
    return response.json();
  },

  createApiConfiguration: async (config: Partial<ApiConfiguration>) => {
    const response = await apiRequest("POST", "/api/admin/api-config", config);
    return response.json();
  },

  updateApiConfiguration: async (id: string, updates: Partial<ApiConfiguration>) => {
    const response = await apiRequest("PUT", `/api/admin/api-config/${id}`, updates);
    return response.json();
  },

  deleteApiConfiguration: async (id: string) => {
    await apiRequest("DELETE", `/api/admin/api-config/${id}`);
  },

  // Unified Ads API
  getAds: async (): Promise<Ad[]> => {
    const response = await apiRequest("GET", "/api/admin/ads");
    return response.json();
  },

  createAd: async (ad: Partial<Ad>) => {
    const response = await apiRequest("POST", "/api/ads", ad);
    return response.json();
  },

  updateAd: async (id: number, updates: Partial<Ad>) => {
    const response = await apiRequest("PUT", `/api/ads/${id}`, updates);
    return response.json();
  },

  deleteAd: async (id: number) => {
    await apiRequest("DELETE", `/api/ads/${id}`);
  },

  // Legacy Ad Networks (for backward compatibility)
  getAdNetworks: async (): Promise<AdNetwork[]> => {
    const response = await apiRequest("GET", "/api/admin/ad-networks");
    return response.json();
  },

  createAdNetwork: async (network: Partial<AdNetwork>) => {
    const response = await apiRequest("POST", "/api/admin/ad-networks", network);
    return response.json();
  },

  updateAdNetwork: async (id: string, updates: Partial<AdNetwork>) => {
    const response = await apiRequest("PUT", `/api/admin/ad-networks/${id}`, updates);
    return response.json();
  },

  deleteAdNetwork: async (id: string) => {
    await apiRequest("DELETE", `/api/admin/ad-networks/${id}`);
  },

  // Legacy Custom Banners (for backward compatibility)
  getBanners: async (): Promise<CustomBanner[]> => {
    const response = await apiRequest("GET", "/api/admin/banners");
    return response.json();
  },

  createBanner: async (banner: Partial<CustomBanner>) => {
    const response = await apiRequest("POST", "/api/admin/banners", banner);
    return response.json();
  },

  updateBanner: async (id: string, updates: Partial<CustomBanner>) => {
    const response = await apiRequest("PUT", `/api/admin/banners/${id}`, updates);
    return response.json();
  },

  deleteBanner: async (id: string) => {
    await apiRequest("DELETE", `/api/admin/banners/${id}`);
  },

  // Site Settings
  getSettings: async (): Promise<SiteSetting[]> => {
    const response = await apiRequest("GET", "/api/admin/settings");
    return response.json();
  },

  updateSetting: async (key: string, value: string) => {
    const response = await apiRequest("PUT", `/api/admin/settings/${key}`, { value });
    return response.json();
  },

  // SEO Settings
  getSeoSettings: async () => {
    const response = await apiRequest("GET", "/api/admin/seo");
    return response.json();
  },

  createSeoSetting: async (setting: any) => {
    const response = await apiRequest("POST", "/api/admin/seo", setting);
    return response.json();
  },

  updateSeoSetting: async (path: string, updates: any) => {
    const response = await apiRequest("PUT", `/api/admin/seo/${encodeURIComponent(path)}`, updates);
    return response.json();
  },

  deleteSeoSetting: async (path: string) => {
    await apiRequest("DELETE", `/api/admin/seo/${encodeURIComponent(path)}`);
  },
};

// Analytics API
export const analyticsApi = {
  // Track analytics event
  trackEvent: async (event: Omit<AnalyticsEvent, 'id'>) => {
    const response = await apiRequest("POST", "/api/analytics/track", event);
    return response.json();
  },

  // Get manga analytics (admin only)
  getMangaAnalytics: async (filters: AnalyticsFilters = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const response = await apiRequest("GET", `/api/analytics/manga?${searchParams}`);
    return response.json();
  },

  // Get top manga by views
  getTopManga: async (limit: number = 10, dateFrom?: string, dateTo?: string) => {
    const searchParams = new URLSearchParams();
    searchParams.set('limit', limit.toString());
    if (dateFrom) searchParams.set('dateFrom', dateFrom);
    if (dateTo) searchParams.set('dateTo', dateTo);

    const response = await apiRequest("GET", `/api/analytics/top-manga?${searchParams}`);
    return response.json();
  },

  // Get analytics dashboard data
  getDashboardStats: async () => {
    const response = await apiRequest("GET", "/api/analytics/dashboard");
    return response.json();
  }
};
