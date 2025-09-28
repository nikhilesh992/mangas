import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { MangaReader } from "@/components/manga/manga-reader";
import { AdSlot } from "@/components/ads/ad-slot";
import { mangaApi } from "@/lib/api";

export default function Reader() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { data: chapter, isLoading, error } = useQuery({
    queryKey: ["/api/chapter", id],
    queryFn: () => mangaApi.getChapter(id!),
    enabled: !!id,
  });

  // If no chapter ID is provided, redirect to home
  if (!id) {
    navigate("/");
    return null;
  }

  // If chapter is missing/API returns empty → redirect back to manga details page
  if (error || (chapter && !chapter.images?.length)) {
    // Get manga ID from chapter data - if not available, go to home page
    const mangaId = chapter?.mangaId;
    
    if (mangaId) {
      navigate(`/manga/${mangaId}`);
    } else {
      // If no manga ID available, redirect to home page (prevents 404)
      navigate("/");
    }
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center" data-testid="reader-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (!chapter) return null;

  return (
    <div className="bg-background flex-1" data-testid="reader-page">
      {/* Ad Slot - Reader Top */}
      <AdSlot position="reader_top" />
      
      <MangaReader chapter={chapter} />
      
      {/* Ad Slot - Reader Bottom */}
      <AdSlot position="reader_bottom" />
    </div>
  );
}
