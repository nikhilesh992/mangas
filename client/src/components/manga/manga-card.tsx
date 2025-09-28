import { Link } from "wouter";
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Manga } from "@/lib/types";
import { analytics } from "@/lib/analytics";
const placeholderImage = "/stock-manga.jpg";

interface MangaCardProps {
  manga: Manga;
  showFavoriteButton?: boolean;
  onFavoriteClick?: (manga: Manga) => void;
  isFavorited?: boolean;
  layout?: "grid" | "list";
}

export function MangaCard({ 
  manga, 
  showFavoriteButton = false, 
  onFavoriteClick,
  isFavorited = false,
  layout = "grid"
}: MangaCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteClick?.(manga);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = placeholderImage;
  };

  const handleMangaClick = () => {
    analytics.trackMangaClick(manga.id, manga.title, 'home');
  };

  // Determine the source based on ID prefix
  const isFromMangaPlus = manga.id.startsWith('mp-');
  const sourceDotColor = isFromMangaPlus ? 'bg-green-500' : 'bg-blue-500';

  if (layout === "list") {
    return (
      <Link href={`/manga/${manga.id}`} data-testid={`manga-card-${manga.id}`} onClick={handleMangaClick}>
        <div className="manga-card bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer group">
          <div className="flex gap-4 p-4 sm:p-6">
            {/* Cover Image */}
            <div className="relative flex-shrink-0">
            <img
              src={manga.coverUrl || placeholderImage}
              alt={`${manga.title} cover`}
              className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-300"
              loading="lazy"
              onError={handleImageError}
              data-testid={`manga-cover-${manga.id}`}
            />
            {showFavoriteButton && (
              <Button
                variant="ghost"
                size="sm"
                className={`absolute -top-2 -right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm ${isFavorited ? "text-red-500 bg-red-50" : "text-muted-foreground hover:text-red-500"}`}
                onClick={handleFavoriteClick}
                data-testid={`favorite-button-${manga.id}`}
              >
                <Heart className={`h-3 w-3 ${isFavorited ? "fill-current" : ""}`} />
              </Button>
            )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Title and Status */}
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-base sm:text-lg text-foreground line-clamp-2 leading-tight" title={manga.title} data-testid={`manga-title-${manga.id}`}>
                  {manga.title}
                </h4>
                <Badge 
                  variant={manga.status === 'ongoing' ? 'default' : manga.status === 'completed' ? 'secondary' : 'outline'} 
                  className="text-xs whitespace-nowrap ml-2" 
                  data-testid={`manga-status-${manga.id}`}
                >
                  {manga.status}
                </Badge>
              </div>
              
              {/* Description */}
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed" data-testid={`manga-description-${manga.id}`}>
                {manga.description || "No description available."}
              </p>
              
              {/* Genres */}
              <div className="flex flex-wrap gap-1.5">
                {manga.genres.slice(0, 4).map((genre, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                    {genre}
                  </Badge>
                ))}
                {manga.genres.length > 4 && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    +{manga.genres.length - 4}
                  </Badge>
                )}
              </div>
              
              {/* Footer Info */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-muted-foreground font-medium">4.2</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className={`w-2 h-2 rounded-full ${sourceDotColor}`}></div>
                    {manga.year || 'Unknown Year'}
                  </div>
                </div>
                
                {manga.latestChapter && manga.latestChapter !== 'null' && (
                  <div className="text-right">
                    <p className="text-xs font-medium text-foreground" data-testid={`latest-chapter-${manga.id}`}>
                      Ch. {manga.latestChapter}
                    </p>
                    <p className="text-xs text-muted-foreground">Latest</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/manga/${manga.id}`} data-testid={`manga-card-${manga.id}`} onClick={handleMangaClick}>
      <div className="manga-card bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all cursor-pointer group">
        <div className="relative">
          <img
            src={manga.coverUrl || placeholderImage}
            alt={`${manga.title} cover`}
            className="w-full h-48 sm:h-64 object-cover"
            loading="lazy"
            onError={handleImageError}
            data-testid={`manga-cover-${manga.id}`}
          />
          
          {showFavoriteButton && (
            <Button
              variant="ghost"
              size="sm"
              className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                isFavorited ? "text-red-500" : "text-white"
              }`}
              onClick={handleFavoriteClick}
              data-testid={`favorite-button-${manga.id}`}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
            </Button>
          )}

          {manga.contentRating && manga.contentRating !== "safe" && (
            <Badge 
              variant="destructive" 
              className="absolute top-2 left-2 text-xs"
              data-testid={`content-rating-${manga.id}`}
            >
              {manga.contentRating.toUpperCase()}
            </Badge>
          )}
          
          {/* Source Dot Indicator */}
          <div className={`absolute bottom-2 right-2 w-3 h-3 rounded-full ${sourceDotColor}`}></div>
        </div>

        <div className="p-3">
          <h4 
            className="font-semibold text-sm text-foreground truncate mb-1"
            title={manga.title}
            data-testid={`manga-title-${manga.id}`}
          >
            {manga.title}
          </h4>
          
          {manga.genres.length > 0 && (
            <p 
              className="text-xs text-muted-foreground truncate mb-2"
              data-testid={`manga-genres-${manga.id}`}
            >
              {manga.genres.slice(0, 3).join(", ")}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Star className="h-3 w-3 text-yellow-400 mr-1" />
              <span 
                className="text-xs text-muted-foreground"
                data-testid={`manga-rating-${manga.id}`}
              >
                {/* In a real app, you'd calculate this from user ratings */}
                4.{Math.floor(Math.random() * 9) + 1}
              </span>
            </div>
            
            <Badge 
              variant={manga.status === "completed" ? "secondary" : "default"}
              className="text-xs"
              data-testid={`manga-status-${manga.id}`}
            >
              {manga.status}
            </Badge>
          </div>

          {manga.latestChapter && manga.latestChapter !== 'null' && (
            <div className="mt-1 space-y-1">
              <p 
                className="text-xs text-muted-foreground"
                data-testid={`latest-chapter-${manga.id}`}
              >
                Latest: Ch. {manga.latestChapter}
              </p>
              {(manga as any).latestChapterDate && (
                <p className="text-xs text-muted-foreground opacity-75">
                  {new Date((manga as any).latestChapterDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
