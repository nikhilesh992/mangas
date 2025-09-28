import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Settings, ArrowLeft, ZoomIn, ZoomOut, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { mangaApi, progressApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Chapter } from "@/lib/types";

interface MangaReaderProps {
  chapter: Chapter;
}

type ViewMode = "single" | "double" | "vertical";

export function MangaReader({ chapter }: MangaReaderProps) {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Early return if chapter is not loaded
  if (!chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="reader-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chapter...</p>
        </div>
      </div>
    );
  }
  
  // Fetch all chapters for this manga to enable chapter navigation
  const { data: allChapters } = useQuery({
    queryKey: ["/api/manga", chapter.mangaId, "chapters"],
    queryFn: () => mangaApi.getChapters(chapter.mangaId!),
    enabled: !!chapter.mangaId,
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"single" | "double" | "vertical">("single");
  const [autoProgress, setAutoProgress] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [zoom, setZoom] = useState(100);
  const [pageViewMode, setPageViewMode] = useState<"single" | "full">("single");
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLImageElement | null)[]>([]);

  const images = chapter.images || [];
  const totalPages = images.length;

  // Find current chapter index and adjacent chapters
  // Note: chapters are returned in descending order from API (latest first)
  const chapters = allChapters?.data || [];
  const currentChapterIndex = chapters.findIndex((ch: Chapter) => ch.id === chapter.id);
  // In descending order: previous chapter has higher index, next chapter has lower index
  const previousChapter = currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null;
  const nextChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;

  // Update reading progress
  const updateProgressMutation = useMutation({
    mutationFn: progressApi.updateProgress,
    onError: () => {
      toast({ title: "Failed to save reading progress", variant: "destructive" });
    },
  });

  // Save progress when page changes
  useEffect(() => {
    if (isAuthenticated && autoProgress && chapter.id) {
      updateProgressMutation.mutate({
        mangaId: chapter.mangaId || chapter.id.split('-')[0], // Use proper mangaId when available
        chapterId: chapter.id,
        pageNumber: currentPage,
        totalPages,
        completed: currentPage === totalPages,
      });
    }
  }, [currentPage, isAuthenticated, autoProgress, chapter.id, chapter.mangaId, totalPages]);

  // Auto-hide controls functionality
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000); // Hide after 3 seconds
    setControlsTimeout(timeout);
  };

  // Handle mouse movement to show controls
  useEffect(() => {
    const handleMouseMove = () => {
      showControlsTemporarily();
    };

    const handleClick = () => {
      showControlsTemporarily();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleClick);
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      showControlsTemporarily();
      switch (event.key) {
        case "ArrowLeft":
        case "a":
          event.preventDefault();
          handlePreviousPage();
          break;
        case "ArrowRight":
        case "d":
          event.preventDefault();
          handleNextPage();
          break;
        case "ArrowUp":
        case "w":
          if (viewMode !== "vertical") {
            event.preventDefault();
            handlePreviousPage();
          }
          break;
        case "ArrowDown":
        case "s":
          if (viewMode !== "vertical") {
            event.preventDefault();
            handleNextPage();
          }
          break;
        case "Escape":
          // Navigate back to manga detail page instead of home
          if (chapter.mangaId) {
            navigate(`/manga/${chapter.mangaId}`);
          } else {
            navigate("/");
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [currentPage, viewMode, controlsTimeout]);

  // Handle scroll for vertical mode
  useEffect(() => {
    if (viewMode === "vertical") {
      const handleScroll = () => {
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        
        // Find which page is currently in view
        pageRefs.current.forEach((img, index) => {
          if (img) {
            const rect = img.getBoundingClientRect();
            if (rect.top <= windowHeight / 2 && rect.bottom >= windowHeight / 2) {
              if (index + 1 !== currentPage) {
                setCurrentPage(index + 1);
              }
            }
          }
        });
      };

      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [viewMode, currentPage]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      
      if (viewMode !== "vertical") {
        scrollToPage(newPage);
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      
      if (viewMode !== "vertical") {
        scrollToPage(newPage);
      }
    }
  };

  const scrollToPage = (pageNumber: number) => {
    const pageElement = pageRefs.current[pageNumber - 1];
    if (pageElement) {
      pageElement.scrollIntoView({ 
        behavior: "smooth", 
        block: "center" 
      });
    }
  };

  const handlePageJump = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      scrollToPage(page);
    }
  };

  const handlePreviousChapter = () => {
    if (previousChapter) {
      navigate(`/reader/${previousChapter.id}`);
    }
  };

  const handleNextChapter = () => {
    if (nextChapter) {
      navigate(`/reader/${nextChapter.id}`);
    }
  };

  const getImageStyle = () => ({
    transform: `scale(${zoom / 100})`, // Fixed zoom scaling
    transformOrigin: 'center top',
    width: '100%', // 100% - 15% left - 15% right = 70%
    maxWidth: '800px',
    height: 'auto',
    marginLeft: '0%',
    marginRight: '15%',
    display: 'block',
  });

  const getContainerClass = () => {
    switch (viewMode) {
      case "single":
        return "flex items-center justify-center min-h-screen";
      case "double":
        return "flex items-center justify-center min-h-screen space-x-2";
      default: // vertical
        return "space-y-2";
    }
  };

  if (!images.length) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="reader-no-images">
        <p className="text-muted-foreground">No images available for this chapter</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="manga-reader">
      {/* Reader Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40" data-testid="reader-header">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  if (chapter.mangaId) {
                    navigate(`/manga/${chapter.mangaId}`);
                  } else {
                    navigate("/");
                  }
                }}
                data-testid="back-button"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="font-semibold text-foreground text-sm" data-testid="reader-title">
                  Chapter {chapter.chapter}
                </h2>
                {chapter.title && (
                  <p className="text-xs text-muted-foreground" data-testid="reader-chapter-title">
                    {chapter.title}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Page</span>
                <input
                  type="number"
                  value={currentPage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePageJump(parseInt(e.target.value))}
                  min="1"
                  max={totalPages}
                  className="w-16 bg-input border border-border rounded px-2 py-1 text-center text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="page-input"
                />
                <span>of {totalPages}</span>
              </div>
              
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="settings-button">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="reader-settings-dialog">
                  <DialogHeader>
                    <DialogTitle>Reader Settings</DialogTitle>
                    <DialogDescription>
                      Customize your reading experience
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="view-mode">View Mode</Label>
                      <Select value={viewMode} onValueChange={(value: string) => setViewMode(value as ViewMode)}>
                        <SelectTrigger data-testid="view-mode-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vertical">Vertical Scroll</SelectItem>
                          <SelectItem value="single">Single Page</SelectItem>
                          <SelectItem value="double">Double Page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="page-view-mode">Page Navigation</Label>
                      <Select value={pageViewMode} onValueChange={(value: string) => setPageViewMode(value as "single" | "full")}>
                        <SelectTrigger data-testid="page-view-mode-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single Page Navigation</SelectItem>
                          <SelectItem value="full">Full Chapter View</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pageViewMode === "single" ? "Show page navigation controls" : "Hide page navigation, show all pages"}
                      </p>
                    </div>
                    
                    <div>
                      <Label>Zoom: {zoom}%</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setZoom(Math.max(50, zoom - 25))}
                          data-testid="zoom-out-button"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Slider
                          value={[zoom]}
                          onValueChange={([value]: number[]) => setZoom(value)}
                          min={50}
                          max={200}
                          step={25}
                          className="flex-1"
                          data-testid="zoom-slider"
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setZoom(Math.min(200, zoom + 25))}
                          data-testid="zoom-in-button"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setZoom(100)}
                          data-testid="zoom-reset-button"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {isAuthenticated && (
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto-save Progress</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically save reading progress
                          </p>
                        </div>
                        <Switch
                          checked={autoProgress}
                          onCheckedChange={setAutoProgress}
                          data-testid="auto-progress-switch"
                        />
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Reader Content */}
      <div className="container mx-auto max-w-4xl px-4" data-testid="reader-content">
        <div className={getContainerClass()}>
          {/* Always show all images in vertical scroll mode */}
          <div className="space-y-2 px-4">
            {images.map((imageUrl, index) => (
              <img
                key={index}
                ref={(el) => (pageRefs.current[index] = el)}
                src={imageUrl}
                alt={`Page ${index + 1}`}
                className="reader-page mx-auto block rounded shadow-lg"
                style={getImageStyle()}
                loading="lazy"
                data-testid={`reader-page-${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Chapter Navigation - Only show on hover/interaction */}
      {showControls && (
        <div className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-40 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`} data-testid="reader-top-navigation">
          <Card className="bg-card/90 backdrop-blur-sm">
            <CardContent className="px-4 py-2 flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviousChapter}
                disabled={!previousChapter}
                title={previousChapter ? `Previous: Ch. ${previousChapter.chapter}` : "No previous chapter"}
                data-testid="prev-chapter-button"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <div className="text-xs text-muted-foreground px-2" data-testid="chapter-indicator">
                Ch. {chapter?.chapter || "N/A"}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextChapter}
                disabled={!nextChapter}
                title={nextChapter ? `Next: Ch. ${nextChapter.chapter}` : "No next chapter"}
                data-testid="next-chapter-button"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
