import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Send, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { commentsApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { MangaComment } from "@shared/schema";

interface MangaCommentsProps {
  mangaId: string;
}

export function MangaComments({ mangaId }: MangaCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const { isAuthenticated, user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ["/api/manga", mangaId, "comments"],
    queryFn: () => commentsApi.getMangaComments(mangaId),
  });

  const createCommentMutation = useMutation({
    mutationFn: (content: string) => commentsApi.createMangaComment(mangaId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manga", mangaId, "comments"] });
      setNewComment("");
      toast({ title: "Comment posted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to post comment", variant: "destructive" });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => commentsApi.deleteMangaComment(mangaId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manga", mangaId, "comments"] });
      toast({ title: "Comment deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete comment", variant: "destructive" });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createCommentMutation.mutate(newComment.trim());
  };

  const handleDeleteComment = (commentId: string) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  return (
    <Card className="w-full" data-testid="manga-comments">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        {isAuthenticated ? (
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <Textarea
              placeholder="Share your thoughts about this manga..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] resize-none"
              data-testid="comment-textarea"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!newComment.trim() || createCommentMutation.isPending}
                className="gap-2"
                data-testid="submit-comment"
              >
                <Send className="h-4 w-4" />
                {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Join the conversation</p>
            <p className="mb-4">Sign in to share your thoughts about this manga</p>
            <Button asChild data-testid="login-to-comment">
              <a href="/auth/login">Sign In</a>
            </Button>
          </div>
        )}

        {/* Comments List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-6">
            <Separator />
            {comments.map((comment: MangaComment & { username?: string }) => (
              <div key={comment.id} className="flex items-start gap-3" data-testid={`comment-${comment.id}`}>
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm" data-testid={`comment-author-${comment.id}`}>
                        {comment.username || 'Anonymous'}
                      </span>
                      <span className="text-xs text-muted-foreground" data-testid={`comment-date-${comment.id}`}>
                        {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 'Unknown'}
                      </span>
                    </div>
                    {(user?.id === comment.userId || isAdmin) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deleteCommentMutation.isPending}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        data-testid={`delete-comment-${comment.id}`}
                        title={isAdmin && user?.id !== comment.userId ? "Delete as admin" : "Delete your comment"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" data-testid={`comment-content-${comment.id}`}>
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No comments yet</p>
            <p>Be the first to share your thoughts about this manga!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}