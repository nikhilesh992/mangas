import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MangaCarousel } from "@/components/manga/manga-carousel";
import { AdSlot } from "@/components/ads/ad-slot";
import { mangaApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { isAuthenticated } = useAuth();

  const { data: featuredManga } = useQuery({
    queryKey: ["/api/manga", "featured"],
    queryFn: () => mangaApi.searchManga({ 
      limit: 6, 
      order: "desc",
      contentRating: ["safe", "suggestive"]
    }),
  });

  return (
    <div className="space-y-8" data-testid="home-page">
      {/* Hero Section */}
      <section className="gradient-hero" data-testid="hero-section">
        <div className="container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight" data-testid="hero-title">
                Discover Your Next Favorite Manga
              </h1>
              <p className="text-xl text-white/80 leading-relaxed" data-testid="hero-description">
                Explore thousands of manga series with our intuitive reader and discover new stories every day.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90" data-testid="hero-start-reading">
                  <Link href="/browse">Start Reading</Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg" 
                  className="border-white/30 text-white hover:bg-white/10"
                  data-testid="hero-browse-library"
                >
                  <Link href="/browse">Browse Library</Link>
                </Button>
              </div>
            </div>
            <div className="relative" data-testid="hero-image">
              {featuredManga?.data?.[0]?.coverUrl ? (
                <img 
                  src={featuredManga.data[0].coverUrl} 
                  alt="Featured manga cover" 
                  className="rounded-xl shadow-2xl mx-auto max-w-sm"
                />
              ) : (
                <div className="rounded-xl shadow-2xl mx-auto max-w-sm h-80 bg-white/10 flex items-center justify-center">
                  <span className="text-white/60">Featured Manga</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Ad Slot - Homepage Top */}
      <AdSlot position="homepage_top" />

      {/* Latest Updates Carousel */}
      <section className="container mx-auto px-4 py-8" data-testid="latest-updates-section">
        <MangaCarousel 
          title="Latest Updates" 
          searchParams={{ order: "desc", limit: 12 }}
          showFavoriteButtons={isAuthenticated}
        />
      </section>

      {/* Popular Genres */}
      <section className="container mx-auto px-4 py-8" data-testid="popular-genres-section">
        <h3 className="text-2xl font-bold text-foreground mb-6">Popular Genres</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/browse?tags=action" data-testid="genre-action">
            <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg p-6 text-center hover:from-primary/30 hover:to-accent/30 transition-all cursor-pointer">
              <div className="text-2xl mb-3">⚔️</div>
              <h4 className="font-semibold text-foreground">Action</h4>
              <p className="text-sm text-muted-foreground mt-1">1,234 series</p>
            </div>
          </Link>
          
          <Link href="/browse?tags=romance" data-testid="genre-romance">
            <div className="bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-lg p-6 text-center hover:from-pink-500/30 hover:to-red-500/30 transition-all cursor-pointer">
              <div className="text-2xl mb-3">💝</div>
              <h4 className="font-semibold text-foreground">Romance</h4>
              <p className="text-sm text-muted-foreground mt-1">856 series</p>
            </div>
          </Link>
          
          <Link href="/browse?tags=fantasy" data-testid="genre-fantasy">
            <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-lg p-6 text-center hover:from-purple-500/30 hover:to-indigo-500/30 transition-all cursor-pointer">
              <div className="text-2xl mb-3">🔮</div>
              <h4 className="font-semibold text-foreground">Fantasy</h4>
              <p className="text-sm text-muted-foreground mt-1">967 series</p>
            </div>
          </Link>
          
          <Link href="/browse?tags=comedy" data-testid="genre-comedy">
            <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-lg p-6 text-center hover:from-green-500/30 hover:to-teal-500/30 transition-all cursor-pointer">
              <div className="text-2xl mb-3">😄</div>
              <h4 className="font-semibold text-foreground">Comedy</h4>
              <p className="text-sm text-muted-foreground mt-1">623 series</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Recently Updated */}
      <section className="container mx-auto px-4 py-8" data-testid="recently-updated-section">
        <MangaCarousel 
          title="Recently Updated" 
          searchParams={{ order: "desc", limit: 12, hasAvailableChapters: true }}
          showFavoriteButtons={isAuthenticated}
        />
      </section>

      {/* Ad Slot - Homepage Bottom */}
      <AdSlot position="homepage_bottom" />
    </div>
  );
}
