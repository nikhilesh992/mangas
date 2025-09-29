import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Filter, Grid, List, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MangaCard } from "@/components/manga/manga-card";
import { AdSlot } from "@/components/ads/ad-slot";
import { Footer } from "@/components/layout/footer";
import { mangaApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import type { MangaSearchParams } from "@/lib/types";

export default function Home() {
  const [location, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  const [searchParams, setSearchParams] = useState<MangaSearchParams>({
    limit: 20,
    offset: 0,
    order: "latestUploadedChapter",
    contentRating: ["safe", "suggestive"],
  });
  
  const [searchInput, setSearchInput] = useState("");
  
  // Fetch available tags from API
  const { data: tagsData } = useQuery({
    queryKey: ["/api/tags"],
    queryFn: mangaApi.getTags,
  });
  
  const availableTags = tagsData?.data?.map((tag: any) => tag.name) || [];
  
  // Enhanced sort options
  const sortOptions = [
    { value: "none", label: "None" },
    { value: "relevance", label: "Best Match" },
    { value: "latestUploadedChapter", label: "Latest Upload" },
    { value: "oldestUploadedChapter", label: "Oldest Upload" },
    { value: "title", label: "Title Ascending" },
    { value: "title_desc", label: "Title Descending" },
    { value: "rating", label: "Highest Rating" },
    { value: "rating_asc", label: "Lowest Rating" },
    { value: "followedCount", label: "Most Follows" },
    { value: "followedCount_asc", label: "Fewest Follows" },
    { value: "createdAt", label: "Recently Added" },
    { value: "createdAt_asc", label: "Oldest Added" },
    { value: "year", label: "Year Ascending" },
    { value: "year_desc", label: "Year Descending" },
  ];
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Parse URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const params: MangaSearchParams = {
      limit: 20,
      offset: 0,
      order: "latestUploadedChapter",
      contentRating: ["safe", "suggestive"],
    };

    if (urlParams.get("search")) {
      params.search = urlParams.get("search")!;
      setSearchInput(urlParams.get("search")!);
    }
    if (urlParams.get("status")) params.status = [urlParams.get("status")!];
    if (urlParams.get("tags")) {
      const tags = urlParams.getAll("tags");
      if (tags.length > 0) params.tags = tags;
    }
    if (urlParams.get("order")) params.order = urlParams.get("order")!;
    if (urlParams.get("contentRating")) {
      const ratings = urlParams.getAll("contentRating");
      if (ratings.length > 0) params.contentRating = ratings;
    }

    setSearchParams(params);
  }, [location]);

  // Update URL when search params change
  useEffect(() => {
    const urlParams = new URLSearchParams();
    
    if (searchParams.search) urlParams.set("search", searchParams.search);
    if (searchParams.status && searchParams.status.length > 0) {
      searchParams.status.forEach(s => urlParams.append("status", s));
    }
    if (searchParams.tags && searchParams.tags.length > 0) {
      searchParams.tags.forEach(t => urlParams.append("tags", t));
    }
    if (searchParams.order && searchParams.order !== "latestUploadedChapter") {
      urlParams.set("order", searchParams.order);
    }
    if (searchParams.contentRating && searchParams.contentRating.length > 0) {
      searchParams.contentRating.forEach(r => urlParams.append("contentRating", r));
    }
    if (searchParams.offset && searchParams.offset > 0) {
      urlParams.set("offset", searchParams.offset.toString());
    }

    const newUrl = urlParams.toString() ? `/?${urlParams.toString()}` : "/";
    if (newUrl !== location) {
      navigate(newUrl, { replace: true });
    }
  }, [searchParams, location, navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/manga", "home", searchParams],
    queryFn: () => mangaApi.getMangaList(searchParams),
  });

  const handleFilterChange = (key: keyof MangaSearchParams, value: any) => {
    setSearchParams(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange("search", searchInput.trim() || undefined);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    handleFilterChange("search", undefined);
  };
  
  const handleTagToggle = (tag: string) => {
    const currentTags = searchParams.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    handleFilterChange("tags", newTags.length > 0 ? newTags : undefined);
  };
  
  const removeTag = (tag: string) => {
    const newTags = (searchParams.tags || []).filter(t => t !== tag);
    handleFilterChange("tags", newTags.length > 0 ? newTags : undefined);
  };

  const handlePageChange = (offset: number) => {
    setSearchParams(prev => ({ ...prev, offset }));
  };

  const mangaList = data?.data || [];
  const total = data?.total || 0;
  const currentPage = Math.floor((searchParams.offset || 0) / (searchParams.limit || 20)) + 1;
  const totalPages = Math.ceil(total / (searchParams.limit || 20));

  return (
    <div className="flex-1 bg-background" data-testid="home-page">

      {/* Main Content Section */}
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
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

              {/* Tags Filter */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">Tags</Label>
                
                {/* Selected Tags */}
                {searchParams.tags && searchParams.tags.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {searchParams.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeTag(tag)}
                          data-testid={`selected-tag-${tag}`}
                        >
                          {tag}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Tag Selection */}
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {availableTags.map((tag: string) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={searchParams.tags?.includes(tag) || false}
                        onCheckedChange={() => handleTagToggle(tag)}
                        data-testid={`tag-${tag}`}
                      />
                      <Label htmlFor={`tag-${tag}`} className="text-sm cursor-pointer">{tag}</Label>
                    </div>
                  ))}
                </div>
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
                          const current = searchParams.contentRating || [];
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
                onClick={() => {
                  setSearchInput("");
                  setSearchParams({ limit: 20, offset: 0, order: "latestUploadedChapter", contentRating: ["safe", "suggestive"] });
                }}
                data-testid="clear-filters"
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>

          {/* Ad Slot - Below Filter */}
          <div className="mt-4">
            <AdSlot position="homepage_left_filter" />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search Bar */}
          <div className="mb-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  type="search"
                  placeholder="Search manga titles, authors, genres..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 pr-10"
                  data-testid="main-search-input"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                {searchInput && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    data-testid="clear-search-button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button type="submit" data-testid="search-button">
                Search
              </Button>
            </form>
            {searchParams.search && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Searching for:</span>
                <Badge variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors" onClick={handleClearSearch}>
                  {searchParams.search}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              </div>
            )}
          </div>

          {/* Sort and View Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex gap-3 sm:gap-4 sm:ml-auto w-full sm:w-auto">
              {isMobile && (
                <Button
                  variant="secondary"
                  className="flex-1 sm:flex-initial"
                  onClick={() => setShowFilters(true)}
                  data-testid="show-filters-mobile"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              )}

              <Select 
                value={searchParams.order || "latestUploadedChapter"}
                onValueChange={(value) => handleFilterChange("order", value || undefined)}
                data-testid="sort-select"
              >
                <SelectTrigger className="flex-1 sm:flex-initial sm:w-48">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex bg-muted rounded-lg p-1 gap-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  data-testid="grid-view"
                  className="px-3 py-1.5"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  data-testid="list-view"
                  className="px-3 py-1.5"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Ad Slot - Homepage Top */}
          <div className="mb-8 mt-6">
            <AdSlot position="homepage_top" />
          </div>

          {/* Results */}
          {error && (
            <div className="text-center py-8" data-testid="home-error">
              <p className="text-muted-foreground">Failed to load manga. Please try again later.</p>
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-8" data-testid="home-loading">
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
                  Showing {((searchParams.offset || 0) + 1)}–{Math.min((searchParams.offset || 0) + (searchParams.limit || 20), total)} of {total.toLocaleString()} results
                  {searchParams.search && ` for "${searchParams.search}"`}
                </p>
              </div>

              {mangaList.length === 0 ? (
                <div className="text-center py-16" data-testid="no-results">
                  <p className="text-muted-foreground text-lg mb-6">No manga found matching your criteria.</p>
                  <Button 
                    className="mt-4"
                    onClick={() => {
                      setSearchInput("");
                      setSearchParams({ limit: 20, offset: 0, order: "latestUploadedChapter", contentRating: ["safe", "suggestive"] });
                    }}
                    data-testid="clear-search"
                  >
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div 
                  className={`grid gap-4 sm:gap-6 mb-8 ${
                    viewMode === "grid" 
                      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                      : "grid-cols-1 sm:grid-cols-2"
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
                <div className="flex justify-center items-center gap-2 sm:gap-3 flex-wrap px-4 py-4" data-testid="pagination">
                  <Button
                    variant="secondary"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(0)}
                    data-testid="button-first"
                    className="min-w-[60px] sm:min-w-[80px] text-sm"
                  >
                    First
                  </Button>
                  
                  <Button
                    variant="secondary"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange((currentPage - 2) * (searchParams.limit || 20))}
                    data-testid="button-prev"
                    className="min-w-[60px] sm:min-w-[80px] text-sm"
                  >
                    Prev
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, currentPage - 2) + i;
                    if (page > totalPages) return null;

                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "secondary"}
                        disabled={page === currentPage}
                        onClick={() => handlePageChange((page - 1) * (searchParams.limit || 20))}
                        data-testid={`button-page-${page}`}
                        className="min-w-[35px] sm:min-w-[40px] h-9 sm:h-10 text-sm"
                      >
                        {page}
                      </Button>
                    );
                  })}

                  <Button
                    variant="secondary"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage * (searchParams.limit || 20))}
                    data-testid="button-next"
                    className="min-w-[60px] sm:min-w-[80px] text-sm"
                  >
                    Next
                  </Button>
                  
                  <Button
                    variant="secondary"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange((totalPages - 1) * (searchParams.limit || 20))}
                    data-testid="button-last"
                    className="min-w-[60px] sm:min-w-[80px] text-sm"
                  >
                    Last
                  </Button>
                </div>
              )}

              {/* Ad Slot - Homepage Bottom */}
              <div className="mt-8">
                <AdSlot position="homepage_bottom" />
              </div>
            </>
          )}
        </div>
      </div>
      </div>
      
      {/* Footer - positioned at the end of all page content */}
      <Footer />
    </div>
  );
}
