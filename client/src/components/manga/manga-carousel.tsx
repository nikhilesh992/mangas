import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MangaCard } from "./manga-card";
import { mangaApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Manga } from "@/lib/types";

interface MangaCarouselProps {
  title: string;
  searchParams?: any;
  showFavoriteButtons?: boolean;
}

export function MangaCarousel({ title, searchParams = {}, showFavoriteButtons = false }: MangaCarouselProps) {
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/manga", "carousel", searchParams],
    queryFn: () => mangaApi.searchManga({ limit: 12, ...searchParams }),
  });

  if (error) {
    return (
      <div className="space-y-4" data-testid="carousel-error">
        <h3 className="text-2xl font-bold text-foreground">{title}</h3>
        <p className="text-muted-foreground">Failed to load manga. Please try again later.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="carousel-loading">
        <h3 className="text-2xl font-bold text-foreground">{title}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div 
              key={i} 
              className="bg-muted rounded-lg h-48 animate-pulse"
              data-testid={`carousel-skeleton-${i}`}
            />
          ))}
        </div>
      </div>
    );
  }

  const mangaList = data?.data || [];

  if (mangaList.length === 0) {
    return (
      <div className="text-center py-8" data-testid="carousel-empty">
        <p className="text-muted-foreground">No manga found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid={`manga-carousel-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-foreground" data-testid="carousel-title">
          {title}
        </h3>
        <Button variant="ghost" size="sm" data-testid="carousel-view-all">
          View All
        </Button>
      </div>

      <div className="relative">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" data-testid="carousel-grid">
          {mangaList.map((manga: Manga) => (
            <MangaCard
              key={manga.id}
              manga={manga}
              showFavoriteButton={showFavoriteButtons && isAuthenticated}
              data-testid={`carousel-manga-${manga.id}`}
            />
          ))}
        </div>

        {/* Navigation arrows - hidden on mobile */}
        {!isMobile && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid="carousel-prev"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid="carousel-next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
