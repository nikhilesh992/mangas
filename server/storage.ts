import {
  users, blogPosts, apiConfigurations, adNetworks, customBanners,
  siteSettings, userFavorites, readingProgress,
  type User, type InsertUser, type BlogPost, type InsertBlogPost,
  type ApiConfiguration, type InsertApiConfiguration,
  type AdNetwork, type InsertAdNetwork,
  type CustomBanner, type InsertCustomBanner,
  type SiteSetting, type InsertSiteSetting,
  type UserFavorite, type InsertUserFavorite,
  type ReadingProgress, type InsertReadingProgress
} from "@shared/schema";
import { db } from "./db";
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

  // Ad Networks
  getAdNetworks(): Promise<AdNetwork[]>;
  getAdNetwork(id: string): Promise<AdNetwork | undefined>;
  getEnabledAdNetworks(): Promise<AdNetwork[]>;
  createAdNetwork(network: InsertAdNetwork): Promise<AdNetwork>;
  updateAdNetwork(id: string, updates: Partial<InsertAdNetwork>): Promise<AdNetwork>;
  deleteAdNetwork(id: string): Promise<void>;

  // Custom Banners
  getCustomBanners(): Promise<CustomBanner[]>;
  getCustomBanner(id: string): Promise<CustomBanner | undefined>;
  getActiveBanners(position?: string): Promise<CustomBanner[]>;
  createCustomBanner(banner: InsertCustomBanner): Promise<CustomBanner>;
  updateCustomBanner(id: string, updates: Partial<InsertCustomBanner>): Promise<CustomBanner>;
  deleteCustomBanner(id: string): Promise<void>;
  incrementBannerImpressions(id: string): Promise<void>;
  incrementBannerClicks(id: string): Promise<void>;

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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
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

  // Ad Networks
  async getAdNetworks(): Promise<AdNetwork[]> {
    return await db.select().from(adNetworks).orderBy(adNetworks.name);
  }

  async getAdNetwork(id: string): Promise<AdNetwork | undefined> {
    const [network] = await db.select().from(adNetworks).where(eq(adNetworks.id, id));
    return network || undefined;
  }

  async getEnabledAdNetworks(): Promise<AdNetwork[]> {
    return await db.select().from(adNetworks).where(eq(adNetworks.enabled, true));
  }

  async createAdNetwork(network: InsertAdNetwork): Promise<AdNetwork> {
    const [newNetwork] = await db.insert(adNetworks).values(network).returning();
    return newNetwork;
  }

  async updateAdNetwork(id: string, updates: Partial<InsertAdNetwork>): Promise<AdNetwork> {
    const [network] = await db.update(adNetworks).set({ ...updates, updatedAt: new Date() }).where(eq(adNetworks.id, id)).returning();
    return network;
  }

  async deleteAdNetwork(id: string): Promise<void> {
    await db.delete(adNetworks).where(eq(adNetworks.id, id));
  }

  // Custom Banners
  async getCustomBanners(): Promise<CustomBanner[]> {
    return await db.select().from(customBanners).orderBy(desc(customBanners.createdAt));
  }

  async getCustomBanner(id: string): Promise<CustomBanner | undefined> {
    const [banner] = await db.select().from(customBanners).where(eq(customBanners.id, id));
    return banner || undefined;
  }

  async getActiveBanners(position?: string): Promise<CustomBanner[]> {
    const conditions = [
      eq(customBanners.active, true),
      or(
        isNull(customBanners.startDate),
        sql`${customBanners.startDate} <= NOW()`
      )
    ];

    if (position) {
      conditions.push(sql`${position} = ANY(${customBanners.positions})`);
    }

    return await db.select().from(customBanners).where(and(...conditions));
  }

  async createCustomBanner(banner: InsertCustomBanner): Promise<CustomBanner> {
    const [newBanner] = await db.insert(customBanners).values(banner).returning();
    return newBanner;
  }

  async updateCustomBanner(id: string, updates: Partial<InsertCustomBanner>): Promise<CustomBanner> {
    const [banner] = await db.update(customBanners).set({ ...updates, updatedAt: new Date() }).where(eq(customBanners.id, id)).returning();
    return banner;
  }

  async deleteCustomBanner(id: string): Promise<void> {
    await db.delete(customBanners).where(eq(customBanners.id, id));
  }

  async incrementBannerImpressions(id: string): Promise<void> {
    await db.update(customBanners)
      .set({ impressions: sql`impressions + 1` })
      .where(eq(customBanners.id, id));
  }

  async incrementBannerClicks(id: string): Promise<void> {
    await db.update(customBanners)
      .set({ clicks: sql`clicks + 1` })
      .where(eq(customBanners.id, id));
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
