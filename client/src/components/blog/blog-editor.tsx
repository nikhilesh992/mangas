import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Eye, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { BlogPost } from "@/lib/types";

const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  featuredImage: z.string().optional(),
  category: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  published: z.boolean().default(false),
});

type BlogPostForm = z.infer<typeof blogPostSchema>;

interface BlogEditorProps {
  post?: BlogPost | null;
  onSave: () => void;
  onCancel: () => void;
}

export function BlogEditor({ post, onSave, onCancel }: BlogEditorProps) {
  const [tags, setTags] = useState<string[]>(post?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BlogPostForm>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: post?.title || "",
      slug: post?.slug || "",
      content: post?.content || "",
      excerpt: post?.excerpt || "",
      featuredImage: post?.featuredImage || "",
      category: post?.category || "",
      metaTitle: post?.metaTitle || "",
      metaDescription: post?.metaDescription || "",
      published: post?.published || false,
    },
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createBlogPost,
    onSuccess: () => {
      toast({ title: "Blog post created successfully" });
      onSave();
    },
    onError: () => {
      toast({ title: "Failed to create blog post", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<BlogPost>) =>
      adminApi.updateBlogPost(id, data),
    onSuccess: () => {
      toast({ title: "Blog post updated successfully" });
      onSave();
    },
    onError: () => {
      toast({ title: "Failed to update blog post", variant: "destructive" });
    },
  });

  // Auto-generate slug from title
  const watchedTitle = watch("title");
  useEffect(() => {
    if (watchedTitle && !post) {
      const slug = watchedTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setValue("slug", slug);
    }
  }, [watchedTitle, setValue, post]);

  const onSubmit = (data: BlogPostForm) => {
    const postData = {
      ...data,
      tags,
      publishedAt: data.published ? new Date().toISOString() : undefined,
    };

    if (post) {
      updateMutation.mutate({ id: post.id, ...postData });
    } else {
      createMutation.mutate(postData);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const previewContent = watch("content");
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="blog-editor">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          {post ? "Edit Blog Post" : "Create Blog Post"}
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            data-testid="toggle-preview"
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? "Edit" : "Preview"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-testid="cancel-edit"
          >
            Cancel
          </Button>
        </div>
      </div>

      {previewMode ? (
        <Card data-testid="blog-preview">
          <CardHeader>
            <CardTitle>{watch("title") || "Untitled Post"}</CardTitle>
            <CardDescription>
              {watch("excerpt") || "No excerpt provided"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: previewContent || "" }}
            />
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="blog-form">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    className={errors.title ? "border-destructive" : ""}
                    data-testid="title-input"
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    {...register("slug")}
                    className={errors.slug ? "border-destructive" : ""}
                    data-testid="slug-input"
                  />
                  {errors.slug && (
                    <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  {...register("excerpt")}
                  rows={3}
                  placeholder="Brief description of the post..."
                  data-testid="excerpt-textarea"
                />
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  {...register("content")}
                  rows={20}
                  className={`font-mono ${errors.content ? "border-destructive" : ""}`}
                  placeholder="Write your blog post content here. You can use HTML tags for formatting..."
                  data-testid="content-textarea"
                />
                {errors.content && (
                  <p className="text-sm text-destructive mt-1">{errors.content.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  You can use HTML tags for formatting. Images, links, and basic styling are supported.
                </p>
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a tag and press Enter"
                    data-testid="tag-input"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    variant="outline"
                    data-testid="add-tag-button"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2" data-testid="tags-list">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 hover:bg-transparent"
                        onClick={() => handleRemoveTag(tag)}
                        data-testid={`remove-tag-${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div>
                <Label htmlFor="featuredImage">Featured Image URL</Label>
                <Input
                  id="featuredImage"
                  {...register("featuredImage")}
                  placeholder="https://example.com/image.jpg"
                  data-testid="featured-image-input"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  {...register("category")}
                  placeholder="e.g., Reviews, News, Guides"
                  data-testid="category-input"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <Label>Published</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this post visible to the public
                  </p>
                </div>
                <Switch
                  checked={watch("published")}
                  onCheckedChange={(checked) => setValue("published", checked)}
                  data-testid="published-switch"
                />
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  {...register("metaTitle")}
                  placeholder="SEO-optimized title (leave empty to use post title)"
                  data-testid="meta-title-input"
                />
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  {...register("metaDescription")}
                  rows={3}
                  placeholder="Brief description for search engines (150-160 characters recommended)"
                  data-testid="meta-description-textarea"
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">SEO Preview</h4>
                <div className="space-y-1">
                  <div className="text-blue-600 text-lg font-medium">
                    {watch("metaTitle") || watch("title") || "Post Title"}
                  </div>
                  <div className="text-green-600 text-sm">
                    https://mangaverse.com/blog/{watch("slug") || "post-slug"}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {watch("metaDescription") || watch("excerpt") || "Post description will appear here..."}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              data-testid="cancel-button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              data-testid="save-button"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : (post ? "Update Post" : "Create Post")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
