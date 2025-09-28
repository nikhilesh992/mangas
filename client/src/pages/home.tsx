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

export default function Home() {
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

  // Get manga data with less strict filtering
  const allManga = data?.data || [];
  const mangaList = allManga.filter((manga: any) => {
    // Only filter out manga that definitely have no chapters
    // More lenient filtering than before
    return manga.hasChapters !== false && manga.latestChapter !== null;
  });
  
  const total = data?.total || 0;
  const currentPage = Math.floor((searchParams.offset || 0) / (searchParams.limit || 20)) + 1;
  const totalPages = Math.ceil(total / (searchParams.limit || 20));

  return (
    <div className="min-h-screen bg-background">
      <div className={`${isMobile ? 'block min-h-screen' : 'flex min-h-screen'}`}>
        {/* Left Sidebar - Filters */}
        <div className={`${isMobile ? 'fixed inset-0 z-50 w-full bg-card' : 'w-72 bg-card border-r border-border flex-shrink-0'} ${isMobile && !showFilters ? "hidden" : ""}`}>
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

            {/* Status Filter */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block text-muted-foreground">Status</Label>
              <Select 
                value={searchParams.status?.[0] || "all"}
                onValueChange={(value: string) => handleFilterChange("status", value === "all" ? undefined : [value])}
                data-testid="status-filter"
              >
                <SelectTrigger className="bg-background">
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
              <Label className="text-sm font-medium mb-3 block text-muted-foreground">Content Rating</Label>
              <div className="space-y-3">
                {["safe", "suggestive", "erotica", "pornographic"].map((rating) => (
                  <div key={rating} className="flex items-center space-x-3">
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
                    <Label htmlFor={rating} className="text-sm capitalize cursor-pointer">{rating}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Publication Demographic */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block text-muted-foreground">Publication Demographic</Label>
              <div className="space-y-3">
                {["shounen", "shoujo", "josei", "seinen"].map((demo) => (
                  <div key={demo} className="flex items-center space-x-3">
                    <Checkbox
                      id={demo}
                      checked={searchParams.publicationDemographic?.includes(demo) || false}
                      onCheckedChange={(checked: boolean) => {
                        const current = searchParams.publicationDemographic || [];
                        if (checked) {
                          handleFilterChange("publicationDemographic", [...current, demo]);
                        } else {
                          handleFilterChange("publicationDemographic", current.filter(d => d !== demo));
                        }
                      }}
                      data-testid={`demo-${demo}`}
                    />
                    <Label htmlFor={demo} className="text-sm capitalize cursor-pointer">{demo}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Original Language */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block text-muted-foreground">Original Language</Label>
              <Select 
                value={searchParams.originalLanguage?.[0] || "all"}
                onValueChange={(value: string) => handleFilterChange("originalLanguage", value === "all" ? undefined : [value])}
                data-testid="original-language-filter"
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="zh-hk">Chinese (Hong Kong)</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="ru">Russian</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Translated Language */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block text-muted-foreground">Available in Language</Label>
              <Select 
                value={searchParams.translatedLanguage?.[0] || "all"}
                onValueChange={(value: string) => handleFilterChange("translatedLanguage", value === "all" ? undefined : [value])}
                data-testid="translated-language-filter"
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="zh-hk">Chinese (Hong Kong)</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="ru">Russian</SelectItem>
                  <SelectItem value="pt-br">Portuguese (Brazil)</SelectItem>
                  <SelectItem value="es-la">Spanish (Latin America)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Publication Year */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-2 block text-muted-foreground">Publication Year</Label>
              <Input
                type="number"
                placeholder="e.g. 2020"
                min="1900"
                max={new Date().getFullYear()}
                value={searchParams.year || ""}
                onChange={(e) => handleFilterChange("year", e.target.value ? Number(e.target.value) : undefined)}
                className="bg-background"
                data-testid="year-input"
              />
            </div>

            {/* Categories/Genres (Tags) */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block text-muted-foreground">Categories/Genres</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                {[
                  { id: "391b0423-d847-456f-aff0-8b0cfc03066b", name: "Action" },
                  { id: "87cc87cd-a395-47af-b27a-93258283bbc6", name: "Adventure" },
                  { id: "5920b825-4181-4a17-beeb-9918b0ff7a30", name: "Boys' Love" },
                  { id: "4d32cc48-9f00-4cca-9b5a-a839f0764984", name: "Comedy" },
                  { id: "b9af3a63-f058-46de-a9a0-e0c13906197a", name: "Drama" },
                  { id: "cdc58593-87dd-415e-bbc0-2ec27bf404cc", name: "Fantasy" },
                  { id: "a3c67850-4684-404e-9b7f-c69850ee5da6", name: "Girls' Love" },
                  { id: "b13b2a48-c720-44a9-9c77-39c9979373fb", name: "Historical" },
                  { id: "cdad7e68-1419-41dd-bdce-27753074a640", name: "Horror" },
                  { id: "ace04997-f6bd-436e-b261-779182193d3d", name: "Isekai" },
                  { id: "2bd2e8d0-f146-434c-9e57-09c0938c5b5b", name: "Magical Girls" },
                  { id: "81c836c9-914a-4eca-981a-560dad663e73", name: "Mecha" },
                  { id: "ee968100-4191-4968-93d3-f82d72be7e46", name: "Medical" },
                  { id: "50880a9d-5440-4732-9afb-8f457127e836", name: "Mystery" },
                  { id: "423e2eae-a7a2-4a8b-ac03-a8351462d71d", name: "Romance" },
                  { id: "256c8bd9-4904-4360-bf4f-508a76d67183", name: "Sci-Fi" },
                  { id: "e5301a23-ebd9-49dd-a0cb-2add944c7fe9", name: "Slice of Life" },
                  { id: "69964a64-2f90-4d33-beeb-f3ed2875eb4c", name: "Sports" },
                  { id: "7064a261-a137-4d3a-8848-2d385de3a99c", name: "Supernatural" },
                  { id: "f8f62932-27da-4fe4-8ee1-6779a8c5edba", name: "Tragedy" },
                  { id: "292e862b-2d17-4062-90a2-0356caa4ae27", name: "Thriller" },
                  { id: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75", name: "Villainess" },
                  { id: "631ef465-9aba-4afb-b0fc-ea10efe274a8", name: "Virtual Reality" },
                  { id: "0a39b5a1-b235-4886-a747-1d05d216532d", name: "Award Winning" },
                  { id: "51d83883-4103-437c-b4b1-731cb73d786c", name: "Cooking" },
                  { id: "9ab53f92-3eed-4e9b-903a-917c86035ee3", name: "Crossdressing" },
                  { id: "da2d50ca-3018-4cc0-ac7a-6b7d472a29ea", name: "Delinquents" },
                  { id: "39730448-9a5f-48a2-85b0-a70db87b1233", name: "Demons" },
                  { id: "f42fbf9e-188a-447b-9fdc-f19dc1e4d685", name: "Doujinshi" },
                  { id: "3e2b8dae-350e-4ab8-a8ce-016e844b9f0d", name: "Long Strip" },
                  { id: "320831a8-4026-470b-94f6-8353740e6f04", name: "Music" },
                  { id: "dd1f77c5-dea9-4e2b-97ae-40dee5365ba2", name: "Oneshot" },
                  { id: "36fd93ea-e8b8-445e-b836-358f02b3d33d", name: "Philosophical" },
                  { id: "0234a31e-a729-4e28-9d6a-3f87c4966b9e", name: "Psychological" },
                  { id: "3b60b75c-a2d7-4860-ab56-05f391bb889c", name: "Reincarnation" },
                  { id: "65761a2a-415e-47f3-bef2-a9dababba7a6", name: "Reverse Harem" },
                  { id: "aafb99c1-7f60-43fa-b75f-fc9502ce29c7", name: "School Life" },
                  { id: "caaa44eb-cd40-4177-b930-79d3ef2afe87", name: "Shota" },
                  { id: "ddefd648-5140-4e5f-ba18-4eca4071d19b", name: "Smut" },
                  { id: "489dd859-9b61-4c37-af75-5b18e88daafc", name: "Survival" },
                  { id: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25", name: "Time Travel" },
                  { id: "d7d1730f-6eb0-4ba6-9437-602cac38664c", name: "Vampires" },
                  { id: "9467335a-1b83-4497-9231-765b1a34f6d3", name: "Video Games" },
                  { id: "d14322ac-4d6f-4e9b-afd9-629d5f4d8a41", name: "Villainess" },
                  { id: "5ca48985-9a9d-4bd8-be29-80dc0303db72", name: "Web Comic" },
                  { id: "acc803a4-c95a-4c22-86fc-eb6b582d82a2", name: "Wuxia" },
                  { id: "85daba54-a71c-4554-8a28-9901a8b0afad", name: "Zombies" }
                ].map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={tag.id}
                      checked={searchParams.tags?.includes(tag.id) || false}
                      onCheckedChange={(checked: boolean) => {
                        const current = searchParams.tags || [];
                        if (checked) {
                          handleFilterChange("tags", [...current, tag.id]);
                        } else {
                          handleFilterChange("tags", current.filter(t => t !== tag.id));
                        }
                      }}
                      data-testid={`tag-${tag.name.toLowerCase().replace(/\s+/g, '-')}`}
                    />
                    <Label htmlFor={tag.id} className="text-sm cursor-pointer">{tag.name}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Excluded Categories */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block text-muted-foreground">Exclude Categories</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-hide">
                {[
                  { id: "b29d6a3d-1569-4e7a-8caf-7557bc92cd5e", name: "Gore" },
                  { id: "97893a4c-12af-4dac-b6be-0dffb353568e", name: "Sexual Violence" },
                  { id: "ddefd648-5140-4e5f-ba18-4eca4071d19b", name: "Smut" },
                  { id: "caaa44eb-cd40-4177-b930-79d3ef2afe87", name: "Shota" },
                  { id: "b11fda93-8f1d-4bef-b2ed-8803d3733170", name: "Loli" },
                  { id: "cdad7e68-1419-41dd-bdce-27753074a640", name: "Horror" }
                ].map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`exclude-${tag.id}`}
                      checked={searchParams.excludedTags?.includes(tag.id) || false}
                      onCheckedChange={(checked: boolean) => {
                        const current = searchParams.excludedTags || [];
                        if (checked) {
                          handleFilterChange("excludedTags", [...current, tag.id]);
                        } else {
                          handleFilterChange("excludedTags", current.filter(t => t !== tag.id));
                        }
                      }}
                      data-testid={`exclude-tag-${tag.name.toLowerCase().replace(/\s+/g, '-')}`}
                    />
                    <Label htmlFor={`exclude-${tag.id}`} className="text-sm cursor-pointer">{tag.name}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* API Source Selection */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block text-muted-foreground">Content Source</Label>
              <Select 
                value={searchParams.source || "all"}
                onValueChange={(value: string) => handleFilterChange("source", value)}
                data-testid="source-select"
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="mangadx">MangaDx (B&W Manga)</SelectItem>
                  <SelectItem value="mangaplus">MangaPlus (Colored Manhua)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            <Button 
              className="w-full bg-primary hover:bg-primary/90" 
              onClick={() => setSearchParams({ limit: 20, offset: 0, order: "desc", contentRating: ["safe", "suggestive", "erotica"], source: "all" })}
              data-testid="clear-filters"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`${isMobile ? 'w-full flex-1 flex flex-col' : 'flex-1 flex flex-col'}`}>
          {/* Top Bar with Search and Controls */}
          <div className="border-b border-border bg-card/50 p-3 sm:p-4 flex-shrink-0">
            <div className="flex items-center gap-4">
              {/* Mobile Filter Button */}
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

              {/* Main Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search manga by title, author, or tags..."
                  value={searchParams.search || ""}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 bg-background w-full"
                  data-testid="main-search-input"
                />
              </div>

              {/* Controls Group */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Sort Dropdown */}
                <Select 
                  value={searchParams.order || "desc"}
                  onValueChange={(value: string) => handleFilterChange("order", value)}
                  data-testid="sort-select"
                >
                  <SelectTrigger className="w-32 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Latest</SelectItem>
                    <SelectItem value="asc">Oldest</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode Toggle */}
                <div className="flex border border-border rounded-lg bg-background">
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
          </div>

          {/* Content Area */}
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            {/* Results Info */}
            {!isLoading && !error && (
              <div className="mb-6" data-testid="results-info">
                <p className="text-sm text-muted-foreground">
                  Showing {mangaList.length} of {total} results
                  {searchParams.search && ` for "${searchParams.search}"`}
                </p>
              </div>
            )}

            {/* Ad Slot */}
            <AdSlot position="homepage_top" />

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8" data-testid="home-loading">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-muted rounded-lg h-80 animate-pulse"
                    data-testid={`home-skeleton-${i}`}
                  />
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12" data-testid="home-error">
                <div className="max-w-md mx-auto">
                  <p className="text-lg text-muted-foreground mb-4">Failed to load manga</p>
                  <p className="text-sm text-muted-foreground mb-6">Please check your connection and try again</p>
                  <p className="text-xs text-red-500 mb-4">Error: {error.message}</p>
                  <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
              </div>
            )}


            {/* Results Grid */}
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
                  className={`grid gap-3 sm:gap-4 md:gap-6 mb-8 ${
                    viewMode === "grid" 
                      ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                      : "grid-cols-1"
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
                  <div className="flex flex-col items-center space-y-4" data-testid="pagination">
                    <div className="flex justify-center items-center space-x-2 flex-wrap gap-2">
                      <Button
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(0)}
                        data-testid="first-page"
                      >
                        First
                      </Button>
                      
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
                        const maxVisible = 5;
                        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                        
                        if (endPage - startPage < maxVisible - 1) {
                          startPage = Math.max(1, endPage - maxVisible + 1);
                        }
                        
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
                        
                        return pages;
                      })()}
                      
                      <Button
                        variant="outline"
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage * (searchParams.limit || 20))}
                        data-testid="next-page"
                      >
                        Next
                      </Button>
                      
                      <Button
                        variant="outline"
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange((totalPages - 1) * (searchParams.limit || 20))}
                        data-testid="last-page"
                      >
                        Last
                      </Button>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages} ({total} total results)
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
