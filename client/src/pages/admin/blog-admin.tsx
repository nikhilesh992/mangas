import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Eye, FileText, Calendar } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BlogEditor } from "@/components/blog/blog-editor";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { BlogPost } from "@/lib/types";

export default function AdminBlogAdmin() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["/api/admin/blog"],
    queryFn: () => adminApi.getAllBlogPosts({ limit: 50 }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteBlogPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      toast({ title: "Blog post deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete blog post", variant: "destructive" });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      adminApi.updateBlogPost(id, { 
        published, 
        publishedAt: published ? new Date().toISOString() : undefined 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      toast({ title: "Post status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update post status", variant: "destructive" });
    },
  });

  const handleEdit = (post: BlogPost) => {
    setSelectedPost(post);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this blog post?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleTogglePublish = (post: BlogPost) => {
    togglePublishMutation.mutate({
      id: post.id,
      published: !post.published,
    });
  };

  const handlePostSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
    setIsDialogOpen(false);
    setSelectedPost(null);
  };

  const filteredPosts = posts?.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8" data-testid="admin-blog">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="blog-admin-title">
            Blog Management
          </h1>
          <p className="text-muted-foreground" data-testid="blog-admin-description">
            Create and manage blog posts
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setSelectedPost(null);
              }}
              data-testid="add-blog-post-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedPost ? "Edit Blog Post" : "Create Blog Post"}
              </DialogTitle>
              <DialogDescription>
                {selectedPost ? "Edit your blog post" : "Write a new blog post"}
              </DialogDescription>
            </DialogHeader>
            
            <BlogEditor
              post={selectedPost}
              onSave={handlePostSaved}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search posts by title, content, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="blog-search-input"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="total-posts-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-4 w-4 text-primary mr-2" />
              <div>
                <p className="text-sm font-medium">Total Posts</p>
                <p className="text-2xl font-bold">{posts?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="published-posts-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Eye className="h-4 w-4 text-green-500 mr-2" />
              <div>
                <p className="text-sm font-medium">Published</p>
                <p className="text-2xl font-bold">
                  {posts?.filter(p => p.published).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="draft-posts-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Edit className="h-4 w-4 text-orange-500 mr-2" />
              <div>
                <p className="text-sm font-medium">Drafts</p>
                <p className="text-2xl font-bold">
                  {posts?.filter(p => !p.published).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="recent-posts-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-blue-500 mr-2" />
              <div>
                <p className="text-sm font-medium">This Month</p>
                <p className="text-2xl font-bold">
                  {posts?.filter(p => {
                    const postDate = new Date(p.createdAt);
                    const now = new Date();
                    return postDate.getMonth() === now.getMonth() && 
                           postDate.getFullYear() === now.getFullYear();
                  }).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blog Posts List */}
      {isLoading ? (
        <div className="space-y-4" data-testid="blog-posts-loading">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="bg-muted rounded h-16 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4" data-testid="blog-posts-list">
          {filteredPosts.map((post) => (
            <Card key={post.id} data-testid={`blog-post-${post.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <Badge 
                        variant={post.published ? "default" : "secondary"}
                        data-testid={`post-status-${post.id}`}
                      >
                        {post.published ? "Published" : "Draft"}
                      </Badge>
                      {post.category && (
                        <Badge variant="outline" data-testid={`post-category-${post.id}`}>
                          {post.category}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {post.excerpt || post.content.substring(0, 150) + "..."}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTogglePublish(post)}
                      disabled={togglePublishMutation.isPending}
                      data-testid={`toggle-publish-${post.id}`}
                    >
                      {post.published ? <Eye className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(post)}
                      data-testid={`edit-post-${post.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`delete-post-${post.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <span>Created: {new Date(post.createdAt).toLocaleDateString()}</span>
                    {post.publishedAt && (
                      <span>Published: {new Date(post.publishedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  
                  {post.published && (
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-primary hover:underline"
                      data-testid={`view-post-${post.id}`}
                    >
                      View Post →
                    </Link>
                  )}
                </div>
                
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2" data-testid={`post-tags-${post.id}`}>
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {filteredPosts.length === 0 && (
            <Card data-testid="no-blog-posts">
              <CardContent className="p-8 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchQuery ? "No posts found" : "No blog posts"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? `No posts match "${searchQuery}"`
                    : "Create your first blog post to get started"
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Post
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
