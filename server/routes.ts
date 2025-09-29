import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { mangaDxService } from "./services/mangadx";
import { AuthService } from "./services/auth";
import { authenticateToken, requireAdmin, optionalAuth, type AuthenticatedRequest } from "./middleware/auth";
import { 
  insertUserSchema, insertBlogPostSchema, insertApiConfigurationSchema,
  insertAdSchema, insertSiteSettingSchema,
  insertUserFavoriteSchema, insertReadingProgressSchema
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, role = 'user' } = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username) || await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      const hashedPassword = await AuthService.hashPassword(password);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role,
      });

      const token = AuthService.generateToken(user);
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        user: userWithoutPassword,
        token,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await AuthService.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = AuthService.generateToken(user);
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        token,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Manga routes
  app.get("/api/manga", async (req, res) => {
    try {
      const {
        limit = 20,
        offset = 0,
        order = 'desc',
        search,
        status,
        tags,
        excludedTags,
        contentRating = ['safe', 'suggestive'],
        source
      } = req.query;

      let mangaDxData: any[] = [];
      let totalCount = 0;

      // Fetch MangaDx data
      try {
        let result;
        
        // If search parameter is provided, use search endpoint
        if (search) {
          result = await mangaDxService.searchManga(search as string, {
            limit: Number(limit),
            offset: Number(offset),
            includes: ['cover_art', 'author', 'artist'],
            hasAvailableChapters: true
          });
        } else {
          // Use manga list endpoint with filters
          let orderParam: string = 'desc';
          let orderField: string = 'updatedAt';
          const orderStr = order as string;

          // Map frontend sorting options to MangaDx API parameters
          switch (orderStr) {
            case 'none':
              orderParam = 'desc';
              orderField = 'updatedAt';
              break;
            case 'relevance':
              orderParam = 'desc';
              orderField = 'relevance';
              break;
            case 'latestUploadedChapter':
              orderParam = 'desc';
              orderField = 'latestUploadedChapter';
              break;
            case 'oldestUploadedChapter':
              orderParam = 'asc';
              orderField = 'latestUploadedChapter';
              break;
            case 'title-asc':
              orderParam = 'asc';
              orderField = 'title';
              break;
            case 'title-desc':
              orderParam = 'desc';
              orderField = 'title';
              break;
            case 'rating-desc':
              orderParam = 'desc';
              orderField = 'rating';
              break;
            case 'rating-asc':
              orderParam = 'asc';
              orderField = 'rating';
              break;
            case 'followedCount-desc':
              orderParam = 'desc';
              orderField = 'followedCount';
              break;
            case 'followedCount-asc':
              orderParam = 'asc';
              orderField = 'followedCount';
              break;
            case 'createdAt-desc':
              orderParam = 'desc';
              orderField = 'createdAt';
              break;
            case 'createdAt-asc':
              orderParam = 'asc';
              orderField = 'createdAt';
              break;
            case 'year-asc':
              orderParam = 'asc';
              orderField = 'year';
              break;
            case 'year-desc':
              orderParam = 'desc';
              orderField = 'year';
              break;
            default:
              orderParam = 'desc';
              orderField = 'updatedAt';
          }

          result = await mangaDxService.getMangaList({
            limit: Number(limit),
            offset: Number(offset),
            order: orderParam,
            orderField: orderField,
            includes: ['cover_art', 'author', 'artist'],
            hasAvailableChapters: true,
            contentRating: Array.isArray(contentRating) ? contentRating as string[] : [contentRating as string],
            status: status ? (Array.isArray(status) ? status as string[] : [status as string]) : undefined,
            tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
            excludedTags: excludedTags ? (Array.isArray(excludedTags) ? excludedTags as string[] : [excludedTags as string]) : undefined
          });
        }

        // Transform MangaDx data (filtering is now handled by the API with hasAvailableChapters: true)
        mangaDxData = result.data
          .map(manga => {
            const originalCoverUrl = mangaDxService.extractCoverArt(manga);
            const proxiedCoverUrl = (originalCoverUrl && originalCoverUrl.trim() !== '') 
              ? `/api/image-proxy?url=${encodeURIComponent(originalCoverUrl)}` 
              : null;
            
            return {
              id: manga.id,
              title: mangaDxService.extractTitle(manga),
              description: mangaDxService.extractDescription(manga),
              coverUrl: proxiedCoverUrl,
              status: manga.attributes.status,
              year: manga.attributes.year,
              contentRating: manga.attributes.contentRating,
              genres: mangaDxService.extractGenres(manga),
              authors: mangaDxService.extractAuthors(manga),
              updatedAt: manga.attributes.updatedAt,
              latestChapter: manga.attributes.lastChapter,
              availableLanguages: manga.attributes.availableTranslatedLanguages,
              hasChapters: true,
              source: 'mangadx'
            };
          });

        totalCount += result.total || 0;
      } catch (error) {
        console.error('Error fetching MangaDx data:', error);
      }

      res.json({
        data: mangaDxData,
        total: totalCount,
        limit: Number(limit),
        offset: Number(offset),
        sources: ['mangadx']
      });
    } catch (error: any) {
      console.error('Error fetching manga list:', error.message);
      res.status(500).json({ message: `Failed to fetch manga: ${error.message}` });
    }
  });

  app.get("/api/manga/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Handle MangaPlus IDs (start with 'mp-')
      if (id.startsWith('mp-')) {
        return res.status(404).json({ message: "MangaPlus support not yet implemented" });
      }
      
      const result = await mangaDxService.getMangaById(id, ['cover_art', 'author', 'artist']);
      const manga = result.data;

      const originalCoverUrl = mangaDxService.extractCoverArt(manga);
      const proxiedCoverUrl = (originalCoverUrl && originalCoverUrl.trim() !== '') 
        ? `/api/image-proxy?url=${encodeURIComponent(originalCoverUrl)}` 
        : null;

      const transformedManga = {
        id: manga.id,
        title: mangaDxService.extractTitle(manga),
        description: mangaDxService.extractDescription(manga),
        coverUrl: proxiedCoverUrl,
        status: manga.attributes.status,
        year: manga.attributes.year,
        contentRating: manga.attributes.contentRating,
        genres: mangaDxService.extractGenres(manga),
        authors: mangaDxService.extractAuthors(manga),
        updatedAt: manga.attributes.updatedAt,
        latestChapter: manga.attributes.lastChapter,
        availableLanguages: manga.attributes.availableTranslatedLanguages,
        hasChapters: true,
        source: 'mangadx'
      };

      res.json(transformedManga);
    } catch (error: any) {
      console.error(`Error fetching manga ${req.params.id}:`, error.message);
      
      // Provide better error responses
      if (error.message.includes('404')) {
        res.status(404).json({ message: "Manga not found" });
      } else {
        res.status(500).json({ message: "Failed to fetch manga details" });
      }
    }
  });

  app.get("/api/manga/:id/chapters", async (req, res) => {
    try {
      const { id } = req.params;
      const { limit = 100, offset = 0, translatedLanguage = ['en'] } = req.query;
      const result = await mangaDxService.getChaptersByMangaId(id, {
        limit: Number(limit),
        offset: Number(offset),
        translatedLanguage: Array.isArray(translatedLanguage) ? translatedLanguage as string[] : [translatedLanguage as string],
        order: 'desc'  // Changed to desc for latest to oldest ordering
      });

      const transformedChapters = result.data.map(chapter => ({
        id: chapter.id,
        volume: chapter.attributes.volume,
        chapter: chapter.attributes.chapter,
        title: chapter.attributes.title,
        language: chapter.attributes.translatedLanguage,
        pages: chapter.attributes.pages,
        publishAt: chapter.attributes.publishAt,
        readableAt: chapter.attributes.readableAt,
        source: 'mangadx'
      }));

      // Sort chapters in descending order (latest first) - server-side sorting to ensure proper order
      const sortedChapters = transformedChapters.sort((a, b) => {
        // First sort by volume (descending)
        const volumeA = parseFloat(a.volume) || 0;
        const volumeB = parseFloat(b.volume) || 0;
        if (volumeA !== volumeB) {
          return volumeB - volumeA;
        }
        
        // Then sort by chapter (descending) - handle decimal chapters properly
        const chapterA = parseFloat(a.chapter) || 0;
        const chapterB = parseFloat(b.chapter) || 0;
        
        // If both are valid numbers, sort numerically
        if (!isNaN(chapterA) && !isNaN(chapterB)) {
          return chapterB - chapterA;
        }
        
        // If one is NaN, put the valid number first
        if (isNaN(chapterA) && !isNaN(chapterB)) return 1;
        if (!isNaN(chapterA) && isNaN(chapterB)) return -1;
        
        // If both are NaN, sort alphabetically (descending)
        return b.chapter.localeCompare(a.chapter);
      });

      res.json({
        data: sortedChapters,
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      });
    } catch (error: any) {
      console.error(`Error fetching chapters for manga ${req.params.id}:`, error.message);
      
      // If it's a MangaDx API error, provide more graceful handling
      if (error.message.includes('MangaDx API error: 400')) {
        // Return empty result for 400 errors (might be no chapters available)
        res.json({
          data: [],
          total: 0,
          limit: Number(req.query.limit || 100),
          offset: Number(req.query.offset || 0),
        });
      } else if (error.message.includes('MangaDx API error: 404')) {
        res.status(404).json({ message: "Manga not found or no chapters available" });
      } else {
        res.status(500).json({ message: `Failed to fetch chapters: ${error.message}` });
      }
    }
  });

  app.get("/api/chapter/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [chapterResult, imagesResult] = await Promise.all([
        mangaDxService.getChapterById(id),
        mangaDxService.getChapterImages(id)
      ]);

      const chapter = chapterResult.data;
      const images = imagesResult.chapter.data.map(filename => {
        const originalImageUrl = mangaDxService.buildImageUrl(imagesResult.baseUrl, imagesResult.chapter.hash, filename);
        return `/api/image-proxy?url=${encodeURIComponent(originalImageUrl)}`;
      });

      // Extract manga ID from chapter relationships
      const mangaRelationship = chapter.relationships.find(rel => rel.type === 'manga');
      const mangaId = mangaRelationship?.id;

      res.json({
        id: chapter.id,
        mangaId: mangaId,
        volume: chapter.attributes.volume,
        chapter: chapter.attributes.chapter,
        title: chapter.attributes.title,
        language: chapter.attributes.translatedLanguage,
        pages: chapter.attributes.pages,
        images,
        hash: imagesResult.chapter.hash,
        baseUrl: imagesResult.baseUrl,
        source: 'mangadx'
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Tags endpoint - fetch available tags from MangaDx
  app.get("/api/tags", async (req, res) => {
    try {
      const result = await mangaDxService.getTags();
      
      // Transform tags for frontend use
      const tags = result.data
        .filter(tag => tag.attributes.group === 'genre') // Only genre tags
        .map(tag => ({
          id: tag.id,
          name: tag.attributes.name.en || Object.values(tag.attributes.name)[0],
          group: tag.attributes.group
        }))
        .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

      res.json({
        data: tags,
        total: tags.length
      });
    } catch (error: any) {
      console.error('Error fetching tags:', error.message);
      res.status(500).json({ message: `Failed to fetch tags: ${error.message}` });
    }
  });

  // User favorites routes
  app.get("/api/favorites", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const favorites = await storage.getUserFavorites(req.user!.userId);
      res.json(favorites);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/favorites", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { mangaId, mangaTitle, mangaCover } = insertUserFavoriteSchema.parse({
        ...req.body,
        userId: req.user!.userId
      });

      const favorite = await storage.addUserFavorite({
        userId: req.user!.userId,
        mangaId,
        mangaTitle,
        mangaCover,
      });

      res.status(201).json(favorite);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/favorites/:mangaId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { mangaId } = req.params;
      await storage.removeUserFavorite(req.user!.userId, mangaId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Reading progress routes
  app.get("/api/reading-progress", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const progress = await storage.getUserReadingProgress(req.user!.userId);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/reading-progress", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const progressData = insertReadingProgressSchema.parse({
        ...req.body,
        userId: req.user!.userId
      });

      const progress = await storage.updateReadingProgress(progressData);
      res.json(progress);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Blog routes
  app.get("/api/blog", async (req, res) => {
    try {
      const { limit = 10, offset = 0, search } = req.query;

      let posts;
      if (search) {
        posts = await storage.searchBlogPosts(search as string);
      } else {
        posts = await storage.getBlogPosts(Number(limit), Number(offset), true);
      }

      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post || !post.published) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      res.json(post);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes - Blog management
  app.get("/api/admin/blog", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const posts = await storage.getBlogPosts(Number(limit), Number(offset));
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/blog", authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const postData = insertBlogPostSchema.parse({
        ...req.body,
        authorId: req.user!.userId
      });

      const post = await storage.createBlogPost(postData);
      res.status(201).json(post);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/blog/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const post = await storage.updateBlogPost(id, updates);
      res.json(post);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/blog/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBlogPost(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes - API Configuration
  app.get("/api/admin/api-config", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const configs = await storage.getApiConfigurations();
      res.json(configs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/api-config", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const configData = insertApiConfigurationSchema.parse(req.body);
      const config = await storage.createApiConfiguration(configData);
      res.status(201).json(config);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/api-config/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const config = await storage.updateApiConfiguration(id, updates);
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/api-config/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteApiConfiguration(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes - Ad Networks
  app.get("/api/admin/ad-networks", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const networks = await storage.getAdNetworks();
      res.json(networks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/ad-networks", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const networkData = insertAdSchema.parse(req.body);
      const network = await storage.createAdNetwork(networkData);
      res.status(201).json(network);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/ad-networks/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const network = await storage.updateAdNetwork(id, updates);
      res.json(network);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/ad-networks/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAdNetwork(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes - Custom Banners
  app.get("/api/admin/banners", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const banners = await storage.getCustomBanners();
      res.json(banners);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/banners", authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
    try {
      const bannerData = insertAdSchema.parse(req.body);
      
      // In a real app, you'd upload the image to S3/Cloudinary and get the URL
      // For now, we'll use a placeholder URL
      const imageUrl = req.file ? `/uploads/${Date.now()}-${req.file.originalname}` : bannerData.bannerImage;
      
      const banner = await storage.createCustomBanner({
        ...bannerData,
        imageUrl,
      });
      
      res.status(201).json(banner);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/banners/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const banner = await storage.updateCustomBanner(id, updates);
      res.json(banner);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/banners/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCustomBanner(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Banner click tracking
  app.post("/api/banners/:id/click", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementBannerClicks(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Public ad/banner routes
  app.get("/api/ads/networks", async (req, res) => {
    try {
      const networks = await storage.getEnabledAdNetworks();
      res.json(networks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/ads/banners", async (req, res) => {
    try {
      const { position } = req.query;
      const banners = await storage.getActiveBanners(position as string);
      
      // Increment impressions for returned banners
      await Promise.all(banners.map(banner => storage.incrementBannerImpressions(banner.id)));
      
      res.json(banners);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes - Site Settings
  app.get("/api/admin/settings", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/settings/:key", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      const setting = await storage.updateSiteSetting(key, value);
      res.json(setting);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin routes - User Management
  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
      // This would need pagination in a real app
      res.json({ message: "User management endpoint - implement based on needs" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin dashboard stats
  app.get("/api/admin/stats", authenticateToken, requireAdmin, async (req, res) => {
    try {
      // In a real app, you'd calculate actual stats from the database
      const stats = {
        totalViews: 1234567,
        activeUsers: 45678,
        adRevenue: 2345,
        blogPosts: 156,
        totalManga: 9876,
        totalChapters: 123456,
      };
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Image proxy route to handle CORS issues with MangaDx images
  app.get("/api/image-proxy", async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string' || url.trim() === '') {
        // Return a placeholder image instead of JSON error
        return await servePlaceholderImage(res, "No URL provided");
      }

      // Decode the URL in case it's URL-encoded
      const decodedUrl = decodeURIComponent(url);
      
      // Only allow MangaDx URLs for security  
      const isMangaDxUrl = decodedUrl.includes('uploads.mangadex.org') || decodedUrl.includes('mangadex.network') || decodedUrl.includes('.mangadex.org') || decodedUrl.includes('.mangadex.network');
      if (!isMangaDxUrl) {
        return await servePlaceholderImage(res, "Invalid URL");
      }

      // Add proper headers to mimic a browser request
      const imageResponse = await fetch(decodedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!imageResponse.ok) {
        console.log(`Failed to fetch image: ${decodedUrl}, status: ${imageResponse.status}`);
        return await servePlaceholderImage(res, "Image not found");
      }

      // Set appropriate headers
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      const contentLength = imageResponse.headers.get('content-length');
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }

      // Stream the image
      const buffer = await imageResponse.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error: any) {
      console.error('Image proxy error:', error.message);
      return await servePlaceholderImage(res, "Failed to load");
    }
  });

  // Helper function to serve placeholder image
  async function servePlaceholderImage(res: any, text: string = "No Cover") {
    try {
      // First try to serve the stock manga image from public directory
      const fs = await import('fs');
      const path = await import('path');
      const stockImagePath = path.resolve(import.meta.dirname, '..', 'client', 'public', 'stock-manga.jpg');
      
      console.log(`Trying to serve stock image from: ${stockImagePath}`);
      
      if (fs.existsSync(stockImagePath)) {
        console.log('Stock image found, serving it...');
        const imageBuffer = fs.readFileSync(stockImagePath);
        console.log(`Serving stock image fallback: ${stockImagePath}`);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.send(imageBuffer);
      }
      
      // Fallback to placeholder URL if stock image doesn't exist
      const placeholderUrl = `https://via.placeholder.com/400x600/1a1a1a/ffffff?text=${encodeURIComponent(text)}`;
      const placeholderResponse = await fetch(placeholderUrl);
      
      if (placeholderResponse.ok) {
        const contentType = placeholderResponse.headers.get('content-type') || 'image/png';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache placeholder for 1 hour
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        const buffer = await placeholderResponse.arrayBuffer();
        return res.send(Buffer.from(buffer));
      } else {
        // If even placeholder fails, generate a simple SVG
        const svgPlaceholder = `<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#1a1a1a"/>
          <text x="50%" y="50%" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
        </svg>`;
        
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.send(svgPlaceholder);
      }
    } catch (error) {
      // Last resort - return a minimal SVG
      const minimalSvg = `<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#333333"/>
        <text x="50%" y="50%" font-family="Arial" font-size="14" fill="white" text-anchor="middle">Manga Cover</text>
      </svg>`;
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(minimalSvg);
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
