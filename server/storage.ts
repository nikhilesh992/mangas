import {
  users, blogPosts, apiConfigurations, ads,
  siteSettings, userFavorites, readingProgress,
  pageViews, adClicks, userSessions, seoSettings,
  type User, type InsertUser, type BlogPost, type InsertBlogPost,
  type ApiConfiguration, type InsertApiConfiguration,
  type Ad, type InsertAd,
  type SiteSetting, type InsertSiteSetting,
  type UserFavorite, type InsertUserFavorite,
  type ReadingProgress, type InsertReadingProgress,
  type PageView, type InsertPageView,
  type AdClick, type InsertAdClick,
  type UserSession, type InsertUserSession,
  type SeoSetting, type InsertSeoSetting
} from "@shared/schema";
import { db, memoryUsers, memoryAds, memorySiteSettings } from "./db";
import { eq, desc, like, and, or, sql, isNull } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Blog Posts
  getBlogPosts(limit?: number, offset?: number, published?: boolean): Promise<BlogPost[]>;
  getBlogPost(id: string): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, updates: Partial<InsertBlogPost>): Promise<BlogPost>;
  deleteBlogPost(id: string): Promise<void>;
  searchBlogPosts(query: string): Promise<BlogPost[]>;

  // API Configurations
  getApiConfigurations(): Promise<ApiConfiguration[]>;
  getApiConfiguration(id: string): Promise<ApiConfiguration | undefined>;
  getEnabledApiConfigurations(): Promise<ApiConfiguration[]>;
  createApiConfiguration(config: InsertApiConfiguration): Promise<ApiConfiguration>;
  updateApiConfiguration(id: string, updates: Partial<InsertApiConfiguration>): Promise<ApiConfiguration>;
  deleteApiConfiguration(id: string): Promise<void>;

  // Ads (unified ad networks and banners)
  getAds(): Promise<Ad[]>;
  getAd(id: number): Promise<Ad | undefined>;
  getAdsBySlot(slot: string): Promise<Ad[]>;
  getEnabledAds(): Promise<Ad[]>;
  createAd(ad: InsertAd): Promise<Ad>;
  updateAd(id: number, updates: Partial<InsertAd>): Promise<Ad>;
  deleteAd(id: number): Promise<void>;

  // Site Settings
  getSiteSettings(): Promise<SiteSetting[]>;
  getSiteSetting(key: string): Promise<SiteSetting | undefined>;
  setSiteSetting(setting: InsertSiteSetting): Promise<SiteSetting>;
  updateSiteSetting(key: string, value: string): Promise<SiteSetting>;

  // User Favorites
  getUserFavorites(userId: string): Promise<UserFavorite[]>;
  getUserFavorite(userId: string, mangaId: string): Promise<UserFavorite | undefined>;
  addUserFavorite(favorite: InsertUserFavorite): Promise<UserFavorite>;
  removeUserFavorite(userId: string, mangaId: string): Promise<void>;

  // Reading Progress
  getUserReadingProgress(userId: string): Promise<ReadingProgress[]>;
  getReadingProgress(userId: string, mangaId: string): Promise<ReadingProgress | undefined>;
  updateReadingProgress(progress: InsertReadingProgress): Promise<ReadingProgress>;
  deleteReadingProgress(userId: string, mangaId: string): Promise<void>;

  // Analytics
  trackPageView(data: InsertPageView): Promise<PageView>;
  trackAdClick(data: InsertAdClick): Promise<AdClick>;
  createOrUpdateSession(data: InsertUserSession): Promise<UserSession>;
  getPageViewsStats(timeRange?: string): Promise<any>;
  getAdClicksStats(timeRange?: string): Promise<any>;
  getSessionStats(timeRange?: string): Promise<any>;
  getTopPages(limit?: number): Promise<any>;

  // SEO Settings
  getSeoSettings(): Promise<SeoSetting[]>;
  getSeoSetting(path: string): Promise<SeoSetting | undefined>;
  createSeoSetting(setting: InsertSeoSetting): Promise<SeoSetting>;
  updateSeoSetting(path: string, updates: Partial<InsertSeoSetting>): Promise<SeoSetting>;
  deleteSeoSetting(path: string): Promise<void>;

  // Database Backup & Restore
  createBackup(): Promise<any>;
  restoreFromBackup(backupData: any, options?: { clearExisting?: boolean }): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    if (!db) {
      // Fallback to memory storage
      for (const [_, user] of Array.from(memoryUsers.values())) {
        if (user.id === id) return user;
      }
      return undefined;
    }
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) {
      // Fallback to memory storage
      return memoryUsers.get(username);
    }
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!db) {
      // Fallback to memory storage
      for (const user of Array.from(memoryUsers.values())) {
        if (user.email === email) return user;
      }
      return undefined;
    }
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) {
      // Fallback to memory storage - not implemented for now
      throw new Error('User creation not available with memory storage');
    }
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set({ ...updates, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Blog Posts
  async getBlogPosts(limit = 20, offset = 0, published?: boolean): Promise<BlogPost[]> {
    if (published !== undefined) {
      return await db.select().from(blogPosts)
        .where(eq(blogPosts.published, published))
        .orderBy(desc(blogPosts.createdAt))
        .limit(limit)
        .offset(offset);
    }
    
    return await db.select().from(blogPosts)
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post || undefined;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post || undefined;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [newPost] = await db.insert(blogPosts).values(post).returning();
    return newPost;
  }

  async updateBlogPost(id: string, updates: Partial<InsertBlogPost>): Promise<BlogPost> {
    const [post] = await db.update(blogPosts).set({ ...updates, updatedAt: new Date() }).where(eq(blogPosts.id, id)).returning();
    return post;
  }

  async deleteBlogPost(id: string): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async searchBlogPosts(query: string): Promise<BlogPost[]> {
    return await db.select().from(blogPosts)
      .where(
        and(
          eq(blogPosts.published, true),
          or(
            like(blogPosts.title, `%${query}%`),
            like(blogPosts.content, `%${query}%`)
          )
        )
      )
      .orderBy(desc(blogPosts.publishedAt));
  }

  // API Configurations
  async getApiConfigurations(): Promise<ApiConfiguration[]> {
    return await db.select().from(apiConfigurations).orderBy(apiConfigurations.priority);
  }

  async getApiConfiguration(id: string): Promise<ApiConfiguration | undefined> {
    const [config] = await db.select().from(apiConfigurations).where(eq(apiConfigurations.id, id));
    return config || undefined;
  }

  async getEnabledApiConfigurations(): Promise<ApiConfiguration[]> {
    return await db.select().from(apiConfigurations)
      .where(eq(apiConfigurations.enabled, true))
      .orderBy(apiConfigurations.priority);
  }

  async createApiConfiguration(config: InsertApiConfiguration): Promise<ApiConfiguration> {
    const [newConfig] = await db.insert(apiConfigurations).values(config).returning();
    return newConfig;
  }

  async updateApiConfiguration(id: string, updates: Partial<InsertApiConfiguration>): Promise<ApiConfiguration> {
    const [config] = await db.update(apiConfigurations).set({ ...updates, updatedAt: new Date() }).where(eq(apiConfigurations.id, id)).returning();
    return config;
  }

  async deleteApiConfiguration(id: string): Promise<void> {
    await db.delete(apiConfigurations).where(eq(apiConfigurations.id, id));
  }

  // Ads (unified ad networks and banners)
  async getAds(): Promise<Ad[]> {
    if (!db) {
      // Fallback to memory storage
      return Array.from(memoryAds.values()).sort((a, b) => (a.networkName || '').localeCompare(b.networkName || ''));
    }
    return await db.select().from(ads).orderBy(ads.networkName);
  }

  async getAd(id: number): Promise<Ad | undefined> {
    if (!db) {
      // Fallback to memory storage
      return memoryAds.get(id);
    }
    const [ad] = await db.select().from(ads).where(eq(ads.id, id));
    return ad || undefined;
  }

  async getAdsBySlot(slot: string): Promise<Ad[]> {
    if (!db) {
      // Fallback to memory storage
      return Array.from(memoryAds.values())
        .filter(ad => ad.enabled && ad.slots && ad.slots.includes(slot))
        .sort((a, b) => (a.networkName || '').localeCompare(b.networkName || ''));
    }
    return await db.select().from(ads)
      .where(
        and(
          eq(ads.enabled, true),
          sql`${slot} = ANY(${ads.slots})`
        )
      )
      .orderBy(ads.networkName);
  }

  async getEnabledAds(): Promise<Ad[]> {
    if (!db) {
      // Fallback to memory storage
      return Array.from(memoryAds.values()).filter(ad => ad.enabled);
    }
    return await db.select().from(ads).where(eq(ads.enabled, true));
  }

  async createAd(ad: InsertAd): Promise<Ad> {
    if (!db) {
      // Fallback to memory storage
      const id = Math.max(...Array.from(memoryAds.keys()), 0) + 1;
      const newAd = { 
        id, 
        networkName: ad.networkName ?? null,
        adScript: ad.adScript ?? null,
        bannerImage: ad.bannerImage ?? null,
        bannerLink: ad.bannerLink ?? null,
        width: ad.width ?? 0,
        height: ad.height ?? 0,
        slots: ad.slots ?? null,
        enabled: ad.enabled ?? true,
        createdAt: new Date()
      };
      memoryAds.set(id, newAd);
      return newAd;
    }
    const [newAd] = await db.insert(ads).values(ad).returning();
    return newAd;
  }

  async updateAd(id: number, updates: Partial<InsertAd>): Promise<Ad> {
    if (!db) {
      // Fallback to memory storage
      const existingAd = memoryAds.get(id);
      if (!existingAd) {
        throw new Error('Ad not found');
      }
      const updatedAd = { ...existingAd, ...updates };
      memoryAds.set(id, updatedAd);
      return updatedAd;
    }
    const [ad] = await db.update(ads).set(updates).where(eq(ads.id, id)).returning();
    return ad;
  }

  async deleteAd(id: number): Promise<void> {
    if (!db) {
      // Fallback to memory storage
      memoryAds.delete(id);
      return;
    }
    await db.delete(ads).where(eq(ads.id, id));
  }

  // Site Settings
  async getSiteSettings(): Promise<SiteSetting[]> {
    if (!db) {
      // Fallback to memory storage
      return Array.from(memorySiteSettings.values()).sort((a, b) => a.key.localeCompare(b.key));
    }
    return await db.select().from(siteSettings).orderBy(siteSettings.key);
  }

  async getSiteSetting(key: string): Promise<SiteSetting | undefined> {
    if (!db) {
      // Fallback to memory storage
      return memorySiteSettings.get(key);
    }
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting || undefined;
  }

  async setSiteSetting(setting: InsertSiteSetting): Promise<SiteSetting> {
    const existing = await this.getSiteSetting(setting.key);
    if (existing) {
      return await this.updateSiteSetting(setting.key, setting.value || '');
    }
    
    if (!db) {
      // Fallback to memory storage
      const newSetting: SiteSetting = {
        id: `setting-${Date.now()}`,
        key: setting.key,
        value: setting.value || '',
        type: setting.type || 'string',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memorySiteSettings.set(setting.key, newSetting);
      return newSetting;
    }
    const [newSetting] = await db.insert(siteSettings).values(setting).returning();
    return newSetting;
  }

  async updateSiteSetting(key: string, value: string): Promise<SiteSetting> {
    if (!db) {
      // Fallback to memory storage
      const existing = memorySiteSettings.get(key);
      const updatedSetting: SiteSetting = {
        id: existing?.id || `setting-${Date.now()}`,
        key,
        value,
        type: existing?.type || 'string',
        createdAt: existing?.createdAt || new Date(),
        updatedAt: new Date(),
      };
      memorySiteSettings.set(key, updatedSetting);
      return updatedSetting;
    }
    const [setting] = await db.update(siteSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(siteSettings.key, key))
      .returning();
    return setting;
  }

  // User Favorites
  async getUserFavorites(userId: string): Promise<UserFavorite[]> {
    return await db.select().from(userFavorites)
      .where(eq(userFavorites.userId, userId))
      .orderBy(desc(userFavorites.createdAt));
  }

  async getUserFavorite(userId: string, mangaId: string): Promise<UserFavorite | undefined> {
    const [favorite] = await db.select().from(userFavorites)
      .where(and(eq(userFavorites.userId, userId), eq(userFavorites.mangaId, mangaId)));
    return favorite || undefined;
  }

  async addUserFavorite(favorite: InsertUserFavorite): Promise<UserFavorite> {
    const [newFavorite] = await db.insert(userFavorites).values(favorite).returning();
    return newFavorite;
  }

  async removeUserFavorite(userId: string, mangaId: string): Promise<void> {
    await db.delete(userFavorites)
      .where(and(eq(userFavorites.userId, userId), eq(userFavorites.mangaId, mangaId)));
  }

  // Reading Progress
  async getUserReadingProgress(userId: string): Promise<ReadingProgress[]> {
    return await db.select().from(readingProgress)
      .where(eq(readingProgress.userId, userId))
      .orderBy(desc(readingProgress.updatedAt));
  }

  async getReadingProgress(userId: string, mangaId: string): Promise<ReadingProgress | undefined> {
    const [progress] = await db.select().from(readingProgress)
      .where(and(eq(readingProgress.userId, userId), eq(readingProgress.mangaId, mangaId)));
    return progress || undefined;
  }

  async updateReadingProgress(progress: InsertReadingProgress): Promise<ReadingProgress> {
    const existing = await this.getReadingProgress(progress.userId, progress.mangaId);
    if (existing) {
      const [updated] = await db.update(readingProgress)
        .set({ ...progress, updatedAt: new Date() })
        .where(and(eq(readingProgress.userId, progress.userId), eq(readingProgress.mangaId, progress.mangaId)))
        .returning();
      return updated;
    }
    const [newProgress] = await db.insert(readingProgress).values(progress).returning();
    return newProgress;
  }

  async deleteReadingProgress(userId: string, mangaId: string): Promise<void> {
    await db.delete(readingProgress)
      .where(and(eq(readingProgress.userId, userId), eq(readingProgress.mangaId, mangaId)));
  }

  // Database Backup & Restore
  async createBackup(): Promise<any> {
    if (!db) {
      throw new Error('Database not available for backup');
    }

    try {
      // Fetch all data from all tables
      const [
        allUsers,
        allBlogPosts,
        allApiConfigurations,
        allAds,
        allSiteSettings,
        allUserFavorites,
        allReadingProgress
      ] = await Promise.all([
        db.select().from(users),
        db.select().from(blogPosts),
        db.select().from(apiConfigurations),
        db.select().from(ads),
        db.select().from(siteSettings),
        db.select().from(userFavorites),
        db.select().from(readingProgress)
      ]);

      const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        database: "mangaverse",
        tables: {
          users: allUsers,
          blogPosts: allBlogPosts,
          apiConfigurations: allApiConfigurations,
          ads: allAds,
          siteSettings: allSiteSettings,
          userFavorites: allUserFavorites,
          readingProgress: allReadingProgress
        },
        counts: {
          users: allUsers.length,
          blogPosts: allBlogPosts.length,
          apiConfigurations: allApiConfigurations.length,
          ads: allAds.length,
          siteSettings: allSiteSettings.length,
          userFavorites: allUserFavorites.length,
          readingProgress: allReadingProgress.length
        }
      };

      return backupData;
    } catch (error: any) {
      throw new Error(`Backup creation failed: ${error.message}`);
    }
  }

  async restoreFromBackup(backupData: any, options: { clearExisting?: boolean } = {}): Promise<any> {
    if (!db) {
      throw new Error('Database not available for restore');
    }

    try {
      // Validate backup data structure
      if (!backupData || !backupData.tables) {
        throw new Error('Invalid backup data format');
      }

      const { tables } = backupData;
      const { clearExisting = false } = options;
      const restored = {
        users: 0,
        blogPosts: 0,
        apiConfigurations: 0,
        ads: 0,
        siteSettings: 0,
        userFavorites: 0,
        readingProgress: 0
      };

      // Clear existing data if requested
      if (clearExisting) {
        await Promise.all([
          db.delete(readingProgress),
          db.delete(userFavorites),
          db.delete(blogPosts),
          db.delete(ads),
          db.delete(siteSettings),
          db.delete(apiConfigurations),
          // Note: Keep users last due to foreign key constraints
        ]);
        // Clear users last
        await db.delete(users);
      }

      // Restore data in order (respecting foreign key dependencies)
      
      // 1. Users first (required for other tables)
      if (tables.users && tables.users.length > 0) {
        await db.insert(users).values(tables.users).onConflictDoNothing();
        restored.users = tables.users.length;
      }

      // 2. Independent tables
      if (tables.apiConfigurations && tables.apiConfigurations.length > 0) {
        await db.insert(apiConfigurations).values(tables.apiConfigurations).onConflictDoNothing();
        restored.apiConfigurations = tables.apiConfigurations.length;
      }

      if (tables.ads && tables.ads.length > 0) {
        await db.insert(ads).values(tables.ads).onConflictDoNothing();
        restored.ads = tables.ads.length;
      }

      if (tables.siteSettings && tables.siteSettings.length > 0) {
        await db.insert(siteSettings).values(tables.siteSettings).onConflictDoNothing();
        restored.siteSettings = tables.siteSettings.length;
      }

      // 3. User-dependent tables
      if (tables.blogPosts && tables.blogPosts.length > 0) {
        await db.insert(blogPosts).values(tables.blogPosts).onConflictDoNothing();
        restored.blogPosts = tables.blogPosts.length;
      }

      if (tables.userFavorites && tables.userFavorites.length > 0) {
        await db.insert(userFavorites).values(tables.userFavorites).onConflictDoNothing();
        restored.userFavorites = tables.userFavorites.length;
      }

      if (tables.readingProgress && tables.readingProgress.length > 0) {
        await db.insert(readingProgress).values(tables.readingProgress).onConflictDoNothing();
        restored.readingProgress = tables.readingProgress.length;
      }

      return {
        success: true,
        restored,
        backupVersion: backupData.version,
        backupTimestamp: backupData.timestamp
      };
    } catch (error: any) {
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  // Analytics Implementation
  async trackPageView(data: InsertPageView): Promise<PageView> {
    if (!db) {
      // For memory storage, just return a mock entry
      return {
        id: 'mock-' + Date.now(),
        ...data,
        timestamp: new Date(),
      } as PageView;
    }
    const [pageView] = await db.insert(pageViews).values(data).returning();
    return pageView;
  }

  async trackAdClick(data: InsertAdClick): Promise<AdClick> {
    if (!db) {
      return {
        id: 'mock-' + Date.now(),
        ...data,
        timestamp: new Date(),
      } as AdClick;
    }
    const [adClick] = await db.insert(adClicks).values(data).returning();
    return adClick;
  }

  async createOrUpdateSession(data: InsertUserSession): Promise<UserSession> {
    if (!db) {
      return {
        id: 'mock-' + Date.now(),
        ...data,
        firstSeen: new Date(),
        lastSeen: new Date(),
      } as UserSession;
    }
    
    // Try to find existing session
    const [existingSession] = await db.select().from(userSessions)
      .where(eq(userSessions.sessionId, data.sessionId));
    
    if (existingSession) {
      // Update existing session
      const [updatedSession] = await db.update(userSessions)
        .set({ 
          lastSeen: new Date(),
          pageCount: sql`${userSessions.pageCount} + 1`
        })
        .where(eq(userSessions.sessionId, data.sessionId))
        .returning();
      return updatedSession;
    } else {
      // Create new session
      const [newSession] = await db.insert(userSessions).values(data).returning();
      return newSession;
    }
  }

  async getPageViewsStats(timeRange: string = '7d'): Promise<any> {
    if (!db) {
      return { totalViews: 0, uniqueVisitors: 0, topPages: [] };
    }

    const timeCondition = this.getTimeCondition(timeRange);
    
    const totalViews = await db.select({ count: sql<number>`count(*)` })
      .from(pageViews)
      .where(timeCondition);

    const uniqueVisitors = await db.select({ count: sql<number>`count(distinct ${pageViews.sessionId})` })
      .from(pageViews)
      .where(timeCondition);

    return {
      totalViews: totalViews[0].count,
      uniqueVisitors: uniqueVisitors[0].count,
      timeRange
    };
  }

  async getAdClicksStats(timeRange: string = '7d'): Promise<any> {
    if (!db) {
      return { totalClicks: 0, clicksByAd: [] };
    }

    const timeCondition = sql`${adClicks.timestamp} >= ${this.getStartDate(timeRange)}`;
    
    const totalClicks = await db.select({ count: sql<number>`count(*)` })
      .from(adClicks)
      .where(timeCondition);

    const clicksByAd = await db.select({
      adId: adClicks.adId,
      clicks: sql<number>`count(*)`,
      networkName: ads.networkName
    })
      .from(adClicks)
      .leftJoin(ads, eq(adClicks.adId, ads.id))
      .where(timeCondition)
      .groupBy(adClicks.adId, ads.networkName);

    return {
      totalClicks: totalClicks[0].count,
      clicksByAd,
      timeRange
    };
  }

  async getSessionStats(timeRange: string = '7d'): Promise<any> {
    if (!db) {
      return { totalSessions: 0, avgSessionLength: 0 };
    }

    const timeCondition = sql`${userSessions.firstSeen} >= ${this.getStartDate(timeRange)}`;
    
    const sessions = await db.select()
      .from(userSessions)
      .where(timeCondition);

    const totalSessions = sessions.length;
    const avgPageViews = sessions.reduce((sum: number, s: UserSession) => sum + (s.pageCount || 1), 0) / totalSessions || 0;

    return {
      totalSessions,
      avgPageViews: Math.round(avgPageViews * 100) / 100,
      timeRange
    };
  }

  async getTopPages(limit: number = 10): Promise<any> {
    if (!db) {
      return [];
    }

    return await db.select({
      path: pageViews.path,
      views: sql<number>`count(*)`
    })
      .from(pageViews)
      .groupBy(pageViews.path)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);
  }

  private getTimeCondition(timeRange: string) {
    const startDate = this.getStartDate(timeRange);
    return sql`${pageViews.timestamp} >= ${startDate}`;
  }

  private getStartDate(timeRange: string): Date {
    const now = new Date();

    switch (timeRange) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  // SEO Settings Implementation
  async getSeoSettings(): Promise<SeoSetting[]> {
    if (!db) {
      return [];
    }
    return await db.select().from(seoSettings).orderBy(seoSettings.path);
  }

  async getSeoSetting(path: string): Promise<SeoSetting | undefined> {
    if (!db) {
      return undefined;
    }
    const [setting] = await db.select().from(seoSettings)
      .where(eq(seoSettings.path, path));
    return setting || undefined;
  }

  async createSeoSetting(setting: InsertSeoSetting): Promise<SeoSetting> {
    if (!db) {
      throw new Error('SEO settings not available with memory storage');
    }
    const [newSetting] = await db.insert(seoSettings).values(setting).returning();
    return newSetting;
  }

  async updateSeoSetting(path: string, updates: Partial<InsertSeoSetting>): Promise<SeoSetting> {
    if (!db) {
      throw new Error('SEO settings not available with memory storage');
    }
    const [setting] = await db.update(seoSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(seoSettings.path, path))
      .returning();
    return setting;
  }

  async deleteSeoSetting(path: string): Promise<void> {
    if (!db) {
      throw new Error('SEO settings not available with memory storage');
    }
    await db.delete(seoSettings).where(eq(seoSettings.path, path));
  }
}

export const storage = new DatabaseStorage();
