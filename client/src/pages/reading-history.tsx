import { useQuery } from "@tanstack/react-query";
import { Clock, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { progressApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export default function ReadingHistory() {
  const { isAuthenticated } = useAuth();

  const { data: progress, isLoading, error } = useQuery({
    queryKey: ["/api/reading-progress"],
    queryFn: progressApi.getProgress,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center" data-testid="reading-history-not-authenticated">
        <h1 className="text-2xl font-bold text-foreground mb-2">Sign In Required</h1>
        <p className="text-muted-foreground">Please sign in to view your reading history.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center" data-testid="reading-history-error">
        <h1 className="text-2xl font-bold text-foreground mb-2">Error Loading Reading History</h1>
        <p className="text-muted-foreground">Failed to load your reading history. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="reading-history-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
          <Clock className="h-8 w-8 mr-3 text-primary" />
          Reading History
        </h1>
        <p className="text-muted-foreground">
          Your manga reading progress and history
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4" data-testid="reading-history-loading">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-muted rounded w-16 h-20 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="bg-muted rounded h-4 animate-pulse" />
                    <div className="bg-muted rounded h-3 w-2/3 animate-pulse" />
                    <div className="bg-muted rounded h-3 w-1/2 animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : progress && progress.length === 0 ? (
        <Card data-testid="reading-history-empty">
          <CardContent className="p-8 text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Reading History</h2>
            <p className="text-muted-foreground mb-4">
              Start reading manga to see your progress here
            </p>
            <Button asChild>
              <Link href="/browse">Browse Manga</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4" data-testid="reading-history-count">
            <p className="text-sm text-muted-foreground">
              {progress?.length || 0} manga in your reading history
            </p>
          </div>

          <div className="space-y-4" data-testid="reading-history-list">
            {progress?.map((item) => (
              <Card key={item.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-20 bg-muted rounded flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1" data-testid={`manga-title-${item.id}`}>
                          Manga {item.mangaId}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2" data-testid={`chapter-info-${item.id}`}>
                          Chapter {item.chapterId}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={item.completed ? "default" : "secondary"}
                            data-testid={`progress-status-${item.id}`}
                          >
                            {item.completed ? "Completed" : "In Progress"}
                          </Badge>
                          <span className="text-xs text-muted-foreground" data-testid={`page-progress-${item.id}`}>
                            Page {item.pageNumber}
                            {item.totalPages && ` of ${item.totalPages}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right text-sm text-muted-foreground">
                        <p data-testid={`last-read-${item.id}`}>
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </p>
                        {item.totalPages && (
                          <div className="w-24 bg-muted rounded-full h-2 mt-1">
                            <div 
                              className="bg-primary h-2 rounded-full"
                              style={{ 
                                width: `${Math.round((item.pageNumber / item.totalPages) * 100)}%` 
                              }}
                              data-testid={`progress-bar-${item.id}`}
                            />
                          </div>
                        )}
                      </div>
                      
                      <Button asChild variant="outline" size="sm" data-testid={`continue-reading-${item.id}`}>
                        <Link href={`/reader/${item.chapterId}`}>
                          Continue Reading
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
