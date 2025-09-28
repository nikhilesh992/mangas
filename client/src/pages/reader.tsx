import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { MangaReader } from "@/components/manga/manga-reader";
import { AdSlot } from "@/components/ads/ad-slot";
import { mangaApi } from "@/lib/api";

export default function Reader() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const [, navigate] = useLocation();

  const { data: chapter, isLoading, error } = useQuery({
    queryKey: ["/api/chapter", chapterId],
    queryFn: () => mangaApi.getChapter(chapterId!),
    enabled: !!chapterId,
  });

  if (!chapterId) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="reader-no-chapter">
        <p className="text-muted-foreground">No chapter specified</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="reader-error">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Chapter Not Found</h1>
          <p className="text-muted-foreground mb-6">The chapter you're looking for doesn't exist or is unavailable.</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => navigate("/")}
              variant="default"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
            
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="reader-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (!chapter) return null;

  return (
    <div className="bg-background min-h-screen" data-testid="reader-page">
      {/* Ad Slot - Reader Top */}
      <AdSlot position="reader_top" />
      
      <MangaReader chapter={chapter} />
      
      {/* Ad Slot - Reader Bottom */}
      <AdSlot position="reader_bottom" />
    </div>
  );
}
