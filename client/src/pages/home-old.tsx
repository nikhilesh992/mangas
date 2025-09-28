import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Filter, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { MangaCard } from "@/components/manga/manga-card";
import { AdSlot } from "@/components/ads/ad-slot";
import { mangaApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import type { MangaSearchParams } from "@/lib/types";

export default function Home() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  const [searchParams, setSearchParams] = useState<MangaSearchParams>({
    limit: 20,
    offset: 0,
    order: "desc",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Parse URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const params: MangaSearchParams = {
      limit: 20,
      offset: 0,
      order: "desc",
    };

    if (urlParams.get("search")) params.search = urlParams.get("search")!;
    if (urlParams.get("status")) params.status = [urlParams.get("status")!];
    if (urlParams.get("tags")) params.tags = [urlParams.get("tags")!];
    if (urlParams.get("order")) params.order = urlParams.get("order")!;

    setSearchParams(params);
  }, [location]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/manga", "home", searchParams],
    queryFn: () => mangaApi.getMangaList(searchParams),
  });

  const handleSearch = (query: string) => {
    setSearchParams(prev => ({ ...prev, search: query, offset: 0 }));
  };

  const handleFilterChange = (key: keyof MangaSearchParams, value: string | string[] | number | undefined) => {
    setSearchParams(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handlePageChange = (offset: number) => {
    setSearchParams(prev => ({ ...prev, offset }));
  };

  const mangaList = data?.data || [];
  const total = data?.total || 0;
  const currentPage = Math.floor((searchParams.offset || 0) / (searchParams.limit || 20)) + 1;
  const totalPages = Math.ceil(total / (searchParams.limit || 20));

  return (
    <div className="container mx-auto px-4 py-8" data-testid="home-page">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className={`lg:w-64 flex-shrink-0 ${isMobile && !showFilters ? "hidden" : ""}`}>
          <Card className="sticky top-24" data-testid="filters-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Filters</h3>
                {isMobile && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowFilters(false)}
                    data-testid="close-filters"
                  >
                    ✕
                  </Button>
                )}
              </div>

              {/* Search */}
              <div className="mb-6">
                <Label htmlFor="search" className="text-sm font-medium mb-2 block">Search</Label>
                <Input
                  id="search"
                  type="search"
                  placeholder="Search manga..."
                  value={searchParams.search || ""}
                  onChange={(e) => handleSearch(e.target.value)}
                  data-testid="search-input"
                />
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">Status</Label>
                <Select 
                  value={searchParams.status?.[0] || "all"}
                  onValueChange={(value) => handleFilterChange("status", value === "all" ? undefined : [value])}
                  data-testid="status-filter"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="hiatus">Hiatus</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Content Rating */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">Content Rating</Label>
                <div className="space-y-2">
                  {["safe", "suggestive", "erotica", "pornographic"].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <Checkbox
                        id={rating}
                        checked={searchParams.contentRating?.includes(rating) || false}
                        onCheckedChange={(checked) => {
                          const current = searchParams.contentRating || ["safe", "suggestive"];
                          if (checked) {
                            handleFilterChange("contentRating", [...current, rating]);
                          } else {
                            handleFilterChange("contentRating", current.filter(r => r !== rating));
                          }
                        }}
                        data-testid={`rating-${rating}`}
                      />
                      <Label htmlFor={rating} className="text-sm capitalize">{rating}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => setSearchParams({ limit: 20, offset: 0, order: "desc" })}
                data-testid="clear-filters"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search and Sort Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Input
                type="search"
                placeholder="Search manga by title, author, or tags..."
                value={searchParams.search || ""}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
                data-testid="main-search-input"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>

            <div className="flex gap-2">
              {isMobile && (
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(true)}
                  data-testid="show-filters-mobile"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              )}

              <Select 
                value={searchParams.order || "desc"}
                onValueChange={(value) => handleFilterChange("order", value)}
                data-testid="sort-select"
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Latest</SelectItem>
                  <SelectItem value="asc">Oldest</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border border-border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  data-testid="grid-view"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  data-testid="list-view"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Ad Slot */}
          <AdSlot position="homepage_top" />

          {/* Results */}
          {error && (
            <div className="text-center py-8" data-testid="home-error">
              <p className="text-muted-foreground">Failed to load manga. Please try again later.</p>
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8" data-testid="home-loading">
              {Array.from({ length: 12 }).map((_, i) => (
                <div 
                  key={i} 
                  className="bg-muted rounded-lg h-64 animate-pulse"
                  data-testid={`home-skeleton-${i}`}
                />
              ))}
            </div>
          )}

          {!isLoading && !error && (
            <>
              <div className="mb-4" data-testid="results-info">
                <p className="text-sm text-muted-foreground">
                  Showing {mangaList.length} of {total} results
                  {searchParams.search && ` for "${searchParams.search}"`}
                </p>
              </div>

              {mangaList.length === 0 ? (
                <div className="text-center py-16" data-testid="no-results">
                  <p className="text-muted-foreground text-lg">No manga found matching your criteria.</p>
                  <Button 
                    className="mt-4"
                    onClick={() => setSearchParams({ limit: 20, offset: 0, order: "desc" })}
                    data-testid="clear-search"
                  >
                    Clear Search
                  </Button>
                </div>
              ) : (
                <div 
                  className={`grid gap-6 mb-8 ${
                    viewMode === "grid" 
                      ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                      : "grid-cols-1 md:grid-cols-2"
                  }`}
                  data-testid="results-grid"
                >
                  {mangaList.map((manga: any) => (
                    <MangaCard
                      key={manga.id}
                      manga={manga}
                      showFavoriteButton={isAuthenticated}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2" data-testid="pagination">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange((currentPage - 2) * (searchParams.limit || 20))}
                    data-testid="prev-page"
                  >
                    Previous
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, currentPage - 2) + i;
                    if (page > totalPages) return null;

                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        onClick={() => handlePageChange((page - 1) * (searchParams.limit || 20))}
                        data-testid={`page-${page}`}
                      >
                        {page}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage * (searchParams.limit || 20))}
                    data-testid="next-page"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
