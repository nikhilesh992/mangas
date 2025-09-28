import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Calendar, User, Tag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AdSlot } from "@/components/ads/ad-slot";
import { blogApi } from "@/lib/api";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["/api/blog", slug],
    queryFn: () => blogApi.getPostBySlug(slug!),
    enabled: !!slug,
  });

  if (!slug) return <div>Invalid blog post slug</div>;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center" data-testid="blog-post-error">
        <h1 className="text-2xl font-bold text-foreground mb-2">Post Not Found</h1>
        <p className="text-muted-foreground">The blog post you're looking for doesn't exist or has been removed.</p>
        <Button asChild className="mt-4">
          <Link href="/blog">Back to Blog</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8" data-testid="blog-post-loading">
        <div className="max-w-4xl mx-auto">
          <div className="bg-muted rounded h-8 mb-4 animate-pulse" />
          <div className="bg-muted rounded h-4 mb-8 animate-pulse" />
          <div className="bg-muted rounded h-64 mb-8 animate-pulse" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-muted rounded h-4 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="blog-post-page">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Button asChild variant="ghost" className="mb-6" data-testid="back-to-blog">
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>
        </Button>

        {/* Ad Slot - Top */}
        <AdSlot position="blog_post_top" />

        <article data-testid="blog-post-article">
          {/* Featured Image */}
          {post.featuredImage && (
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg mb-8"
              data-testid="blog-post-featured-image"
            />
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="blog-post-title">
            {post.title}
          </h1>

          {/* Meta information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6" data-testid="blog-post-meta">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "Draft"}
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              Author
            </div>
            {post.category && (
              <div className="flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                {post.category}
              </div>
            )}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6" data-testid="blog-post-tags">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <div className="text-lg text-muted-foreground italic mb-6 p-4 border-l-4 border-primary bg-primary/5" data-testid="blog-post-excerpt">
              {post.excerpt}
            </div>
          )}

          <Separator className="mb-8" />

          {/* Ad Slot - Inline */}
          <AdSlot position="blog_post_inline" />

          {/* Content */}
          <div 
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
            data-testid="blog-post-content"
          />

          <Separator className="my-8" />

          {/* Share buttons */}
          <div className="flex items-center space-x-4" data-testid="blog-post-share">
            <span className="text-sm font-medium text-foreground">Share this post:</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: post.title, url: window.location.href });
                }
              }}
              data-testid="share-button"
            >
              Share
            </Button>
          </div>
        </article>

        {/* Navigation to other posts */}
        <div className="mt-12 flex justify-between" data-testid="blog-post-navigation">
          <Button asChild variant="outline">
            <Link href="/blog">← All Posts</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
