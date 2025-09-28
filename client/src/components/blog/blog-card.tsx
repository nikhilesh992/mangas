import { Link } from "wouter";
import { Calendar, User, Tag, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BlogPost } from "@/lib/types";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`blog-card-${post.id}`}>
      <div className="grid md:grid-cols-3 gap-6">
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="md:col-span-1">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-48 md:h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              data-testid={`blog-image-${post.id}`}
            />
          </div>
        )}
        
        {/* Content */}
        <CardContent className={`p-6 ${post.featuredImage ? 'md:col-span-2' : 'md:col-span-3'}`}>
          <div className="space-y-4">
            {/* Meta information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground" data-testid={`blog-meta-${post.id}`}>
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

            {/* Title */}
            <Link href={`/blog/${post.slug}`} data-testid={`blog-title-link-${post.id}`}>
              <h2 className="text-2xl font-bold text-foreground hover:text-primary cursor-pointer transition-colors line-clamp-2">
                {post.title}
              </h2>
            </Link>

            {/* Excerpt */}
            <p className="text-muted-foreground leading-relaxed line-clamp-3" data-testid={`blog-excerpt-${post.id}`}>
              {post.excerpt || post.content.replace(/<[^>]*>/g, '').substring(0, 200) + "..."}
            </p>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2" data-testid={`blog-tags-${post.id}`}>
                {post.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {post.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{post.tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Read more link */}
            <div className="flex items-center justify-between pt-2">
              <Link 
                href={`/blog/${post.slug}`} 
                className="text-primary hover:text-primary/80 font-medium flex items-center group"
                data-testid={`blog-read-more-${post.id}`}
              >
                Read More
                <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <div className="text-sm text-muted-foreground">
                {Math.ceil(post.content.split(' ').length / 200)} min read
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
