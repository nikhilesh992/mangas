import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, BookOpen, Eye, Calendar, Tag, Play, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AdSlot } from "@/components/ads/ad-slot";
import { MangaCard } from "@/components/manga/manga-card";
import { mangaApi, favoritesApi, progressApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Chapter } from "@/lib/types";

export default function MangaDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: manga, isLoading, error } = useQuery({
    queryKey: ["/api/manga", id],
    queryFn: () => mangaApi.getMangaById(id!),
    enabled: !!id,
  });

  const { data: chapters, isLoading: chaptersLoading } = useQuery({
    queryKey: ["/api/manga", id, "chapters"],
    queryFn: () => mangaApi.getChapters(id!, { limit: 100, translatedLanguage: ["en"] }),
    enabled: !!id,
  });

  const { data: favorites } = useQuery({
    queryKey: ["/api/favorites"],
    queryFn: favoritesApi.getFavorites,
    enabled: isAuthenticated,
  });

  const { data: relatedManga } = useQuery({
    queryKey: ["/api/manga", "related", manga?.genres?.[0]],
    queryFn: () => mangaApi.searchManga({ 
      tags: manga?.genres?.slice(0, 1), 
      limit: 8 
    }),
    enabled: !!manga?.genres?.length,
  });

  const { data: readingProgress } = useQuery({
    queryKey: ["/api/reading-progress"],
    queryFn: progressApi.getProgress,
    enabled: isAuthenticated,
  });

  const addFavoriteMutation = useMutation({
    mutationFn: favoritesApi.addFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({ title: "Added to favorites!" });
    },
    onError: () => {
      toast({ title: "Failed to add to favorites", variant: "destructive" });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: favoritesApi.removeFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({ title: "Removed from favorites" });
    },
    onError: () => {
      toast({ title: "Failed to remove from favorites", variant: "destructive" });
    },
  });

  if (!id) return <div>Invalid manga ID</div>;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center" data-testid="manga-detail-error">
        <h1 className="text-2xl font-bold text-foreground mb-2">Manga Not Found</h1>
        <p className="text-muted-foreground">The manga you're looking for doesn't exist or has been removed.</p>
        <Button asChild className="mt-4">
          <Link href="/browse">Browse Manga</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8" data-testid="manga-detail-loading">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-muted rounded-lg h-96 animate-pulse" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-muted rounded h-8 animate-pulse" />
            <div className="bg-muted rounded h-4 animate-pulse" />
            <div className="bg-muted rounded h-32 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!manga) return null;

  const isFavorited = favorites?.some(fav => fav.mangaId === manga.id);
  const chaptersList = chapters?.data || [];
  
  // Helper functions
  const isChapterRead = (chapterId: string) => {
    return readingProgress?.some(progress => 
      progress.chapterId === chapterId && progress.completed
    ) || false;
  };
  
  // Get first and latest chapters (remember: chapters are now sorted desc from API)
  const latestChapter = chaptersList[0]; // First in desc order = latest
  const firstChapter = chaptersList[chaptersList.length - 1]; // Last in desc order = first

  const handleFavoriteToggle = () => {
    if (isFavorited) {
      removeFavoriteMutation.mutate(manga.id);
    } else {
      addFavoriteMutation.mutate({
        mangaId: manga.id,
        mangaTitle: manga.title,
        mangaCover: manga.coverUrl || undefined,
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="manga-detail-page">
      {/* Ad Slot - Top */}
      <AdSlot position="manga_detail_top" />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Manga Cover and Info */}
        <div className="lg:col-span-1" data-testid="manga-info-sidebar">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <img
                src={manga.coverUrl || "/placeholder-cover.jpg"}
                alt={`${manga.title} cover`}
                className="w-full rounded-lg mb-4"
                data-testid="manga-cover-image"
              />
              
              <h1 className="text-xl font-bold text-foreground mb-2" data-testid="manga-title">
                {manga.title}
              </h1>
              
              {manga.authors.length > 0 && (
                <p className="text-sm text-muted-foreground mb-4" data-testid="manga-authors">
                  by {manga.authors.map(author => author.name).join(", ")}
                </p>
              )}
              
              <div className="space-y-3 mb-4">
                {/* Navigation Buttons */}
                <div className="flex gap-2">
                  <Button 
                    asChild 
                    className="flex-1" 
                    disabled={!firstChapter}
                    data-testid="start-first-chapter-button"
                  >
                    <Link href={firstChapter ? `/reader/${firstChapter.id}` : "#"}>
                      <Play className="h-4 w-4 mr-2" />
                      Start from Chapter 1
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild 
                    variant="secondary"
                    className="flex-1" 
                    disabled={!latestChapter}
                    data-testid="read-latest-chapter-button"
                  >
                    <Link href={latestChapter ? `/reader/${latestChapter.id}` : "#"}>
                      <SkipForward className="h-4 w-4 mr-2" />
                      Read Latest Chapter
                    </Link>
                  </Button>
                </div>
                
                {/* Favorite Button */}
                {isAuthenticated && (
                  <Button
                    variant="outline"
                    onClick={handleFavoriteToggle}
                    disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                    className="w-full"
                    data-testid="favorite-toggle-button"
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isFavorited ? "fill-current text-red-500" : ""}`} />
                    {isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                  </Button>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge 
                    variant={manga.status === "completed" ? "secondary" : "default"}
                    data-testid="manga-status"
                  >
                    {manga.status}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chapters:</span>
                  <span className="text-foreground" data-testid="chapter-count">
                    {chaptersList.length}
                  </span>
                </div>
                
                {manga.year && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Year:</span>
                    <span className="text-foreground" data-testid="manga-year">
                      {manga.year}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rating:</span>
                  <span className="text-foreground" data-testid="manga-rating">
                    {manga.contentRating}
                  </span>
                </div>
              </div>

              {/* Genres */}
              {manga.genres.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Genres</h4>
                  <div className="flex flex-wrap gap-2" data-testid="manga-genres">
                    {manga.genres.map((genre) => (
                      <Badge key={genre} variant="secondary" className="text-xs">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card data-testid="manga-description-card">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Synopsis
              </h3>
              <p className="text-muted-foreground leading-relaxed" data-testid="manga-description">
                {manga.description || "No description available."}
              </p>
            </CardContent>
          </Card>

          {/* Ad Slot - Inline */}
          <AdSlot position="manga_detail_inline" />

          {/* Chapters List */}
          <Card data-testid="chapters-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Chapters
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {chaptersList.length} chapters
                  </span>
                </div>
              </div>

              {chaptersLoading ? (
                <div className="space-y-2" data-testid="chapters-loading">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-muted rounded h-12 animate-pulse" />
                  ))}
                </div>
              ) : chaptersList.length === 0 ? (
                <div className="text-center py-8" data-testid="no-chapters">
                  <p className="text-muted-foreground">No chapters available yet.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto scroll-container" data-testid="chapters-list">
                  {chaptersList.map((chapter: Chapter) => {
                    const isRead = isChapterRead(chapter.id);
                    return (
                      <Link 
                        key={chapter.id} 
                        href={`/reader/${chapter.id}`}
                        data-testid={`chapter-${chapter.id}`}
                      >
                        <div className={`flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors border-l-4 ${
                          isRead 
                            ? "border-red-500 bg-red-50 dark:bg-red-950/20" 
                            : "border-transparent"
                        }`}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className={`font-medium ${
                                isRead 
                                  ? "text-red-600 dark:text-red-400" 
                                  : "text-foreground"
                              }`}>
                                Chapter {chapter.chapter}
                                {chapter.title && `: ${chapter.title}`}
                              </h4>
                              {isRead && (
                                <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                                  READ
                                </Badge>
                              )}
                            </div>
                            <p className={`text-sm mt-1 flex items-center ${
                              isRead 
                                ? "text-red-500 dark:text-red-400" 
                                : "text-muted-foreground"
                            }`}>
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(chapter.publishAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`text-sm ${
                              isRead 
                                ? "text-red-500 dark:text-red-400" 
                                : "text-muted-foreground"
                            }`}>
                              {chapter.language.toUpperCase()}
                            </span>
                            <span className={`text-sm ${
                              isRead 
                                ? "text-red-500 dark:text-red-400" 
                                : "text-muted-foreground"
                            }`}>
                              {chapter.pages} pages
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Manga */}
          {relatedManga?.data && relatedManga.data.length > 0 && (
            <Card data-testid="related-manga-card">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Related Manga
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="related-manga-grid">
                  {relatedManga.data.slice(0, 4).map((relatedItem: any) => (
                    <MangaCard
                      key={relatedItem.id}
                      manga={relatedItem}
                      showFavoriteButton={isAuthenticated}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
