import { Link } from "wouter";
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Manga } from "@/lib/types";

interface MangaCardProps {
  manga: Manga;
  showFavoriteButton?: boolean;
  onFavoriteClick?: (manga: Manga) => void;
  isFavorited?: boolean;
}

export function MangaCard({ 
  manga, 
  showFavoriteButton = false, 
  onFavoriteClick,
  isFavorited = false 
}: MangaCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteClick?.(manga);
  };

  return (
    <Link href={`/manga/${manga.id}`} data-testid={`manga-card-${manga.id}`}>
      <div className="manga-card bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all cursor-pointer group">
        <div className="relative">
          <img
            src={manga.coverUrl || "/placeholder-cover.jpg"}
            alt={`${manga.title} cover`}
            className="w-full h-48 sm:h-64 object-cover"
            loading="lazy"
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

          {manga.latestChapter && (
            <p 
              className="text-xs text-muted-foreground mt-1"
              data-testid={`latest-chapter-${manga.id}`}
            >
              Ch. {manga.latestChapter}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
