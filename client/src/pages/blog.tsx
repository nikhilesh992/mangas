import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BlogCard } from "@/components/blog/blog-card";
import { AdSlot } from "@/components/ads/ad-slot";
import { blogApi } from "@/lib/api";

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ["/api/blog", { search: searchQuery, limit: postsPerPage, offset: (currentPage - 1) * postsPerPage }],
    queryFn: () => blogApi.getPosts({ 
      search: searchQuery || undefined, 
      limit: postsPerPage, 
      offset: (currentPage - 1) * postsPerPage 
    }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="blog-page">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="blog-title">
          Manga Blog
        </h1>
        <p className="text-xl text-muted-foreground" data-testid="blog-subtitle">
          Latest news, reviews, and insights from the manga world
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Blog Posts */}
        <div className="lg:col-span-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="mb-8" data-testid="blog-search-form">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search blog posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="blog-search-input"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>
          </form>

          {/* Ad Slot */}
          <AdSlot position="blog_top" />

          {/* Posts */}
          {error && (
            <div className="text-center py-8" data-testid="blog-error">
              <p className="text-muted-foreground">Failed to load blog posts. Please try again later.</p>
            </div>
          )}

          {isLoading && (
            <div className="space-y-8" data-testid="blog-loading">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="bg-muted rounded h-48 mb-4 animate-pulse" />
                    <div className="bg-muted rounded h-6 mb-2 animate-pulse" />
                    <div className="bg-muted rounded h-4 mb-4 animate-pulse" />
                    <div className="bg-muted rounded h-20 animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && !error && (
            <>
              {posts && posts.length === 0 ? (
                <div className="text-center py-16" data-testid="blog-no-posts">
                  <p className="text-muted-foreground text-lg">
                    {searchQuery ? `No blog posts found for "${searchQuery}"` : "No blog posts available"}
                  </p>
                </div>
              ) : (
                <div className="space-y-8" data-testid="blog-posts-list">
                  {posts?.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {posts && posts.length >= postsPerPage && (
                <div className="flex justify-center mt-12" data-testid="blog-pagination">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      data-testid="blog-prev-page"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
                      Page {currentPage}
                    </span>
                    <Button
                      variant="outline"
                      disabled={posts.length < postsPerPage}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      data-testid="blog-next-page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Categories */}
            <Card data-testid="blog-categories">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Categories</h3>
                <div className="space-y-2">
                  <button 
                    className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => { setSearchQuery("reviews"); setCurrentPage(1); }}
                    data-testid="category-reviews"
                  >
                    Reviews
                  </button>
                  <button 
                    className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => { setSearchQuery("news"); setCurrentPage(1); }}
                    data-testid="category-news"
                  >
                    News
                  </button>
                  <button 
                    className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => { setSearchQuery("recommendations"); setCurrentPage(1); }}
                    data-testid="category-recommendations"
                  >
                    Recommendations
                  </button>
                  <button 
                    className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => { setSearchQuery("industry"); setCurrentPage(1); }}
                    data-testid="category-industry"
                  >
                    Industry
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Newsletter */}
            <Card className="bg-gradient-to-br from-primary/20 to-accent/20" data-testid="blog-newsletter">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3">Stay Updated</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get the latest manga news and reviews delivered to your inbox.
                </p>
                <div className="space-y-3">
                  <Input 
                    type="email" 
                    placeholder="Your email" 
                    data-testid="newsletter-email"
                  />
                  <Button className="w-full" data-testid="newsletter-subscribe">
                    Subscribe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
