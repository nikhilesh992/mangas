import {
  users, blogPosts, apiConfigurations, ads,
  siteSettings, userFavorites, readingProgress,
  type User, type InsertUser, type BlogPost, type InsertBlogPost,
  type ApiConfiguration, type InsertApiConfiguration,
  type Ad, type InsertAd,
  type SiteSetting, type InsertSiteSetting,
  type UserFavorite, type InsertUserFavorite,
  type ReadingProgress, type InsertReadingProgress
} from "@shared/schema";
import { db, memoryUsers, memoryAds } from "./db";
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
    return await db.select().from(siteSettings).orderBy(siteSettings.key);
  }

  async getSiteSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting || undefined;
  }

  async setSiteSetting(setting: InsertSiteSetting): Promise<SiteSetting> {
    const existing = await this.getSiteSetting(setting.key);
    if (existing) {
      return await this.updateSiteSetting(setting.key, setting.value || '');
    }
    const [newSetting] = await db.insert(siteSettings).values(setting).returning();
    return newSetting;
  }

  async updateSiteSetting(key: string, value: string): Promise<SiteSetting> {
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
}

export const storage = new DatabaseStorage();
