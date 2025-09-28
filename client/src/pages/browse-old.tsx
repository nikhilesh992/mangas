import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Filter, Grid, List, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Manga, MangaSearchParams } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MangaCard } from "@/components/manga/manga-card";
import { AdSlot } from "@/components/ads/ad-slot";
import { mangaApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Browse() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  
  const [searchParams, setSearchParams] = useState<MangaSearchParams>({
    limit: 20,
    offset: 0,
    order: "desc",
    contentRating: ["safe", "suggestive", "erotica"],
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
      contentRating: ["safe", "suggestive", "erotica"],
    };

    if (urlParams.get("search")) params.search = urlParams.get("search")!;
    if (urlParams.get("status")) params.status = [urlParams.get("status")!];
    if (urlParams.get("tags")) params.tags = [urlParams.get("tags")!];
    if (urlParams.get("order")) params.order = urlParams.get("order")!;

    setSearchParams(params);
  }, [location]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/manga", "browse", searchParams],
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

  // Filter out manga without available chapters
  const allManga = data?.data || [];
  const mangaList = allManga.filter((manga: any) => {
    // Only show manga that have available chapters
    return manga.hasChapters && 
           manga.availableLanguages && 
           manga.availableLanguages.length > 0 &&
           manga.latestChapter;
  });
  
  const total = data?.total || 0;
  const currentPage = Math.floor((searchParams.offset || 0) / (searchParams.limit || 20)) + 1;
  const totalPages = Math.ceil(total / (searchParams.limit || 20));

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Left Sidebar - Filters */}
        <div className={`w-72 bg-card border-r border-border flex-shrink-0 ${isMobile && !showFilters ? "hidden" : ""}`}>
          <div className="p-6 h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Filters</h2>
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

            {/* Search in Filters */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-2 block text-muted-foreground">Search</Label>
              <Input
                type="search"
                placeholder="Search manga..."
                value={searchParams.search || ""}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-background"
                data-testid="filter-search-input"
              />
            </div>
        {/* Enhanced Filters Sidebar */}
        <div className={`lg:w-80 flex-shrink-0 ${isMobile && !showFilters ? "hidden" : ""}`}>
          <Card className="sticky top-24" data-testid="filters-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Filters</h3>
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

              {/* Status Filter */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">Status</Label>
                <Select 
                  value={searchParams.status?.[0] || "all"}
                  onValueChange={(value: string) => handleFilterChange("status", value === "all" ? undefined : [value])}
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
                        onCheckedChange={(checked: boolean) => {
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

              {/* Publication Year */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">Publication Year</Label>
                <Select 
                  value={searchParams.year?.toString() || "all"}
                  onValueChange={(value: string) => handleFilterChange("year", value === "all" ? undefined : parseInt(value))}
                  data-testid="year-filter"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                    <SelectItem value="2010">2010 & Earlier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Popular Genres */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">Genres</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {[
                    "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", 
                    "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", 
                    "Thriller", "Mystery", "Historical", "School Life", "Martial Arts",
                    "Mecha", "Music", "Psychological", "Shounen", "Shoujo", "Seinen", 
                    "Josei", "Isekai", "Harem", "Ecchi", "Yaoi", "Yuri"
                  ].map((genre) => (
                    <div key={genre} className="flex items-center space-x-2">
                      <Checkbox
                        id={genre}
                        checked={searchParams.tags?.includes(genre.toLowerCase()) || false}
                        onCheckedChange={(checked: boolean) => {
                          const current = searchParams.tags || [];
                          if (checked) {
                            handleFilterChange("tags", [...current, genre.toLowerCase()]);
                          } else {
                            handleFilterChange("tags", current.filter(t => t !== genre.toLowerCase()));
                          }
                        }}
                        data-testid={`genre-${genre.toLowerCase()}`}
                      />
                      <Label htmlFor={genre} className="text-sm">{genre}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Language Filter */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">Language</Label>
                <Select 
                  value={searchParams.translatedLanguage?.[0] || "all"}
                  onValueChange={(value: string) => handleFilterChange("translatedLanguage", value === "all" ? undefined : [value])}
                  data-testid="language-filter"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Languages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="pt-br">Portuguese (BR)</SelectItem>
                    <SelectItem value="ru">Russian</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">Sort By</Label>
                <Select 
                  value={searchParams.order || "desc"}
                  onValueChange={(value: string) => handleFilterChange("order", value)}
                  data-testid="sort-filter"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Latest Updated</SelectItem>
                    <SelectItem value="asc">Oldest Updated</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                    <SelectItem value="year">Publication Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full" 
                onClick={() => setSearchParams({ limit: 20, offset: 0, order: "desc", contentRating: ["safe", "suggestive", "erotica"] })}
                data-testid="clear-filters"
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* View Controls */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {!isLoading && !error && (
                  <span>
                    Showing {mangaList.length} of {total} results
                    {searchParams.search && ` for "${searchParams.search}"`}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">View:</Label>
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
          <AdSlot position="browse_top" />

          {/* Results */}
          {error && (
            <div className="text-center py-12" data-testid="browse-error">
              <div className="max-w-md mx-auto">
                <p className="text-lg text-muted-foreground mb-4">Failed to load manga</p>
                <p className="text-sm text-muted-foreground mb-6">Please check your connection and try again</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8" data-testid="browse-loading">
              {Array.from({ length: 20 }).map((_, i) => (
                <div 
                  key={i} 
                  className="bg-muted rounded-lg h-80 animate-pulse"
                  data-testid={`browse-skeleton-${i}`}
                />
              ))}
            </div>
          )}

          {!isLoading && !error && (
            <>
              {mangaList.length === 0 ? (
              <div className="text-center py-12" data-testid="no-results">
                <div className="max-w-md mx-auto">
                  <p className="text-xl text-muted-foreground mb-4">No manga found</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Try adjusting your filters or search terms to find more results
                  </p>
                  <Button 
                    onClick={() => setSearchParams({ limit: 20, offset: 0, order: "desc", contentRating: ["safe", "suggestive", "erotica"] })}
                    data-testid="clear-search"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className={`grid gap-6 mb-8 ${
                  viewMode === "grid" 
                    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                    : "grid-cols-1"
                }`}
                data-testid="results-grid"
              >
                {mangaList.map((manga: any) => (
                  <MangaCard
                    key={manga.id}
                    manga={manga}
                    showFavoriteButton={isAuthenticated}
                    layout={viewMode}
                  />
                ))}
              </div>
            )}

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col items-center space-y-4" data-testid="pagination">
                  <div className="flex justify-center items-center space-x-2 flex-wrap gap-2">
                    {/* First Page */}
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(0)}
                      data-testid="first-page"
                    >
                      First
                    </Button>
                    
                    {/* Previous Page */}
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange((currentPage - 2) * (searchParams.limit || 20))}
                      data-testid="prev-page"
                    >
                      Previous
                    </Button>
                    
                    {/* Page Numbers */}
                    {(() => {
                      const pages = [];
                      const maxVisible = 7;
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                      
                      // Adjust start if we're near the end
                      if (endPage - startPage < maxVisible - 1) {
                        startPage = Math.max(1, endPage - maxVisible + 1);
                      }
                      
                      // Add ellipsis at start if needed
                      if (startPage > 1) {
                        pages.push(
                          <Button
                            key={1}
                            variant="outline"
                            onClick={() => handlePageChange(0)}
                            data-testid="page-1"
                          >
                            1
                          </Button>
                        );
                        if (startPage > 2) {
                          pages.push(<span key="ellipsis-start" className="px-2">...</span>);
                        }
                      }
                      
                      // Add visible page numbers
                      for (let page = startPage; page <= endPage; page++) {
                        pages.push(
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            onClick={() => handlePageChange((page - 1) * (searchParams.limit || 20))}
                            data-testid={`page-${page}`}
                          >
                            {page}
                          </Button>
                        );
                      }
                      
                      // Add ellipsis at end if needed
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(<span key="ellipsis-end" className="px-2">...</span>);
                        }
                        pages.push(
                          <Button
                            key={totalPages}
                            variant="outline"
                            onClick={() => handlePageChange((totalPages - 1) * (searchParams.limit || 20))}
                            data-testid={`page-${totalPages}`}
                          >
                            {totalPages}
                          </Button>
                        );
                      }
                      
                      return pages;
                    })()}
                    
                    {/* Next Page */}
                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage * (searchParams.limit || 20))}
                      data-testid="next-page"
                    >
                      Next
                    </Button>
                    
                    {/* Last Page */}
                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange((totalPages - 1) * (searchParams.limit || 20))}
                      data-testid="last-page"
                    >
                      Last
                    </Button>
                  </div>
                  
                  {/* Page Info and Direct Page Input */}
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages} ({total} total results)
                    </div>
                    
                    {/* Direct Page Input */}
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="page-input" className="text-sm text-muted-foreground">
                          Go to page:
                        </Label>
                        <Input
                          id="page-input"
                          type="number"
                          min="1"
                          max={totalPages}
                          placeholder={currentPage.toString()}
                          className="w-20 h-8 text-center"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement;
                              const pageNum = parseInt(target.value);
                              if (pageNum >= 1 && pageNum <= totalPages) {
                                handlePageChange((pageNum - 1) * (searchParams.limit || 20));
                                target.value = '';
                              }
                            }
                          }}
                          data-testid="page-input"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            const input = document.getElementById('page-input') as HTMLInputElement;
                            const pageNum = parseInt(input.value);
                            if (pageNum >= 1 && pageNum <= totalPages) {
                              handlePageChange((pageNum - 1) * (searchParams.limit || 20));
                              input.value = '';
                            }
                          }}
                          data-testid="go-to-page"
                        >
                          Go
                        </Button>
                      </div>
                      
                      {/* Quick Jump Buttons */}
                      {totalPages > 10 && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Quick:</span>
                          {[10, 25, 50, 100].filter(page => page <= totalPages && page !== currentPage).slice(0, 3).map(page => (
                            <Button
                              key={page}
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => handlePageChange((page - 1) * (searchParams.limit || 20))}
                              data-testid={`quick-page-${page}`}
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
