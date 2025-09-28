import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MangaCard } from "@/components/manga/manga-card";
import { favoritesApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Favorites() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: favorites, isLoading, error } = useQuery({
    queryKey: ["/api/favorites"],
    queryFn: favoritesApi.getFavorites,
    enabled: isAuthenticated,
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

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center" data-testid="favorites-not-authenticated">
        <h1 className="text-2xl font-bold text-foreground mb-2">Sign In Required</h1>
        <p className="text-muted-foreground">Please sign in to view your favorites.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center" data-testid="favorites-error">
        <h1 className="text-2xl font-bold text-foreground mb-2">Error Loading Favorites</h1>
        <p className="text-muted-foreground">Failed to load your favorites. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="favorites-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
          <Heart className="h-8 w-8 mr-3 text-red-500" />
          My Favorites
        </h1>
        <p className="text-muted-foreground">
          Your bookmarked manga collection
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" data-testid="favorites-loading">
          {Array.from({ length: 10 }).map((_, i) => (
            <div 
              key={i} 
              className="bg-muted rounded-lg h-64 animate-pulse"
              data-testid={`favorites-skeleton-${i}`}
            />
          ))}
        </div>
      ) : favorites && favorites.length === 0 ? (
        <Card data-testid="favorites-empty">
          <CardContent className="p-8 text-center">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Favorites Yet</h2>
            <p className="text-muted-foreground mb-4">
              Start adding manga to your favorites to build your collection
            </p>
            <Button asChild>
              <a href="/browse">Browse Manga</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4" data-testid="favorites-count">
            <p className="text-sm text-muted-foreground">
              {favorites?.length || 0} manga in your favorites
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" data-testid="favorites-grid">
            {favorites?.map((favorite) => {
              // Convert favorite to manga format for MangaCard
              const manga = {
                id: favorite.mangaId,
                title: favorite.mangaTitle || "Unknown Title",
                description: "",
                coverUrl: favorite.mangaCover || null,
                status: "unknown",
                year: 0,
                contentRating: "safe",
                genres: [],
                authors: [],
                updatedAt: favorite.createdAt,
              };

              return (
                <div key={favorite.id} className="relative group">
                  <MangaCard manga={manga} />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFavoriteMutation.mutate(favorite.mangaId)}
                    disabled={removeFavoriteMutation.isPending}
                    data-testid={`remove-favorite-${favorite.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
