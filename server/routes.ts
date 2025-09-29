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
  insertUserFavoriteSchema, insertReadingProgressSchema, insertMangaCommentSchema
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
  // Server-Sent Events setup for real-time settings updates
  const sseClients = new Set<any>();

  // Broadcast settings updates to all connected clients
  const broadcastSettingsUpdate = async () => {
    if (sseClients.size === 0) return;
    
    try {
      const settings = await storage.getSiteSettings();
      const data = `data: ${JSON.stringify({ type: 'settings_update', settings })}\n\n`;
      
      console.log(`Broadcasting settings update to ${sseClients.size} clients`);
      
      for (const client of sseClients) {
        try {
          client.write(data);
        } catch (err) {
          console.error('Error writing to SSE client:', err);
          sseClients.delete(client); // Remove dead connections
        }
      }
    } catch (error) {
      console.error('Error broadcasting settings update:', error);
    }
  };

  app.get('/api/settings/stream', (req, res) => {
    // Properly set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
    
    // Send headers immediately
    res.flushHeaders();

    // Add client to active connections  
    sseClients.add(res);
    console.log(`SSE client connected. Total clients: ${sseClients.size}`);

    // Send initial settings immediately
    storage.getSiteSettings().then(settings => {
      const data = JSON.stringify({ type: 'settings', settings });
      res.write(`data: ${data}\n\n`);
      console.log('Sent initial settings to SSE client');
    }).catch(err => {
      console.error('Error sending initial settings:', err);
    });

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch (err) {
        console.error('Error sending heartbeat:', err);
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 15000);

    // Clean up on disconnect
    req.on('close', () => {
      console.log(`SSE client disconnected. Remaining clients: ${sseClients.size - 1}`);
      clearInterval(heartbeat);
      sseClients.delete(res);
    });

    req.on('error', (err) => {
      console.error('SSE client error:', err);
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // Manga Comments Routes
  app.get("/api/manga/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const comments = await storage.getMangaComments(id);
      res.json(comments);
    } catch (error: any) {
      console.error("Error fetching manga comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/manga/:id/comments", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = insertMangaCommentSchema.parse(req.body);
      const userId = req.user!.userId;
      
      const comment = await storage.createMangaComment({
        userId,
        mangaId: id,
        content,
      });
      
      res.status(201).json(comment);
    } catch (error: any) {
      console.error("Error creating manga comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.delete("/api/manga/:mangaId/comments/:commentId", authenticateToken, async (req, res) => {
    try {
      const { commentId } = req.params;
      const userId = req.user!.userId;
      
      await storage.deleteMangaComment(commentId, userId);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting manga comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

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

  // Unified Ads API (replaces separate ad networks and banners)
  // POST /api/ads → Add new ad (network or banner)
  app.post("/api/ads", authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
    try {
      const adData = insertAdSchema.parse(req.body);
      
      // Handle file upload for banner ads
      if (req.file) {
        adData.bannerImage = `/uploads/${Date.now()}-${req.file.originalname}`;
      }
      
      const ad = await storage.createAd(adData);
      res.status(201).json(ad);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // GET /api/ads?slot=homepage_top → Fetch ads by slot
  app.get("/api/ads", async (req, res) => {
    try {
      const { slot } = req.query;
      
      let ads;
      if (slot) {
        ads = await storage.getAdsBySlot(slot as string);
      } else {
        ads = await storage.getEnabledAds();
      }
      
      res.json(ads);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // PUT /api/ads/:id → Edit ad
  app.put("/api/ads/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ad ID" });
      }
      
      const updates = req.body;
      const ad = await storage.updateAd(id, updates);
      res.json(ad);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // DELETE /api/ads/:id → Delete ad
  app.delete("/api/ads/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ad ID" });
      }
      
      await storage.deleteAd(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin endpoint to get all ads
  app.get("/api/admin/ads", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const ads = await storage.getAds();
      res.json(ads);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Legacy endpoints for backward compatibility (temporary)
  app.get("/api/ads/networks", async (req, res) => {
    try {
      const ads = await storage.getEnabledAds();
      // Filter to only return ads with scripts (network ads)
      const networks = ads.filter(ad => ad.adScript);
      res.json(networks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/ads/banners", async (req, res) => {
    try {
      const { position } = req.query;
      let ads;
      
      if (position) {
        ads = await storage.getAdsBySlot(position as string);
      } else {
        ads = await storage.getEnabledAds();
      }
      
      // Filter to only return ads with banner images (banner ads)
      const banners = ads.filter(ad => ad.bannerImage);
      res.json(banners);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Legacy admin endpoints for backward compatibility (temporary)
  app.get("/api/admin/ad-networks", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const ads = await storage.getAds();
      const networks = ads.filter(ad => ad.adScript);
      res.json(networks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/banners", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const ads = await storage.getAds();
      const banners = ads.filter(ad => ad.bannerImage);
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
      
      // Broadcast update to all connected SSE clients for real-time updates
      broadcastSettingsUpdate();
      console.log(`Broadcasting settings update for key: ${key}`);
      
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
      const timeRange = req.query.timeRange as string || '7d';
      
      // Get real analytics data
      const [pageViews, adClicks, sessions, topPages, blogPosts] = await Promise.all([
        storage.getPageViewsStats(timeRange),
        storage.getAdClicksStats(timeRange),
        storage.getSessionStats(timeRange),
        storage.getTopPages(5),
        storage.getBlogPosts(1000), // Get all blog posts to count them
      ]);

      const stats = {
        totalViews: pageViews.totalViews || 0,
        uniqueVisitors: pageViews.uniqueVisitors || 0,
        totalSessions: sessions.totalSessions || 0,
        avgPageViews: sessions.avgPageViews || 0,
        totalAdClicks: adClicks.totalClicks || 0,
        blogPosts: blogPosts.length || 0,
        topPages: topPages || [],
        timeRange
      };
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Public settings endpoint (no auth required for real-time updates)
  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error getting public settings:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Analytics overview endpoint for admin dashboard
  app.get('/api/admin/analytics/overview', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const timeRange = req.query.timeRange as string || '7d';
      
      // Get comprehensive analytics data
      const [pageViews, adClicks, sessions, topPages] = await Promise.all([
        storage.getPageViewsStats(timeRange),
        storage.getAdClicksStats(timeRange),
        storage.getSessionStats(timeRange),
        storage.getTopPages(10),
      ]);

      const overview = {
        pageViews: {
          totalViews: pageViews.totalViews || 0,
          uniqueVisitors: pageViews.uniqueVisitors || 0,
          timeRange
        },
        adClicks: {
          totalClicks: adClicks.totalClicks || 0,
          clicksByAd: adClicks.clicksByAd || [],
          timeRange
        },
        sessions: {
          totalSessions: sessions.totalSessions || 0,
          avgPageViews: sessions.avgPageViews || 0,
          timeRange
        },
        topPages: topPages || [],
        timeRange
      };
      
      res.json(overview);
    } catch (error: any) {
      console.error('Error getting analytics overview:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Ad click tracking endpoint (public, used by frontend)
  app.post('/api/analytics/adclick', async (req, res) => {
    try {
      const { adId, sessionId, position, path } = req.body;
      
      if (!adId || !sessionId || !position || !path) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const result = await storage.trackAdClick({
        adId: parseInt(adId),
        sessionId,
        position,
        path,
        ipAddress: getClientIP(req),
      });

      res.status(201).json({ success: true, result });
    } catch (error) {
      console.error('Error tracking ad click:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });


  // Admin routes - Database Backup & Restore
  app.get("/api/admin/backup", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const backupData = await storage.createBackup();
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="mangaverse-backup-${new Date().toISOString().split('T')[0]}.json"`);
      
      res.json(backupData);
    } catch (error: any) {
      res.status(500).json({ message: `Backup failed: ${error.message}` });
    }
  });

  app.post("/api/admin/restore", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { backupData, options } = req.body;
      
      if (!backupData) {
        return res.status(400).json({ message: "Backup data is required" });
      }
      
      const result = await storage.restoreFromBackup(backupData, options || {});
      
      res.json({ 
        message: "Database restored successfully", 
        restored: result 
      });
    } catch (error: any) {
      res.status(500).json({ message: `Restore failed: ${error.message}` });
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

  // Analytics routes
  app.post("/api/analytics/pageview", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { path, sessionId, userAgent, referrer, ipAddress } = req.body;
      const userId = req.user?.userId || null;

      await storage.trackPageView({
        userId,
        sessionId,
        path,
        userAgent,
        referrer,
        ipAddress,
      });

      // Update session
      await storage.createOrUpdateSession({
        sessionId,
        userId,
        userAgent,
        ipAddress,
      });

      res.status(201).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/analytics/adclick", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { adId, sessionId, position, path } = req.body;
      const userId = req.user?.userId || null;

      await storage.trackAdClick({
        adId,
        userId,
        sessionId,
        position,
        path,
      });

      res.status(201).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin analytics routes
  app.get("/api/admin/analytics/overview", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const timeRange = req.query.timeRange as string || '7d';
      
      const [pageViews, adClicks, sessions, topPages] = await Promise.all([
        storage.getPageViewsStats(timeRange),
        storage.getAdClicksStats(timeRange),
        storage.getSessionStats(timeRange),
        storage.getTopPages(10)
      ]);

      res.json({
        pageViews,
        adClicks,
        sessions,
        topPages,
        timeRange
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // SEO Settings routes
  app.get("/api/seo", async (req, res) => {
    try {
      const path = req.query.path as string || 'global';
      const setting = await storage.getSeoSetting(path);
      res.json(setting || {});
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/seo", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getSeoSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/seo", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const setting = await storage.createSeoSetting(req.body);
      res.status(201).json(setting);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/seo/:path", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { path } = req.params;
      const setting = await storage.updateSeoSetting(decodeURIComponent(path), req.body);
      res.json(setting);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/seo/:path", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { path } = req.params;
      await storage.deleteSeoSetting(decodeURIComponent(path));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
