import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Settings, Globe, Image, Type, Palette } from "lucide-react";

export default function SiteSettingsPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: () => adminApi.getSettings(),
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminApi.updateSetting(key, value),
    onSuccess: () => {
      // Invalidate all queries to refresh site-wide data
      queryClient.invalidateQueries();
      toast({
        title: "Settings Updated",
        description: "Site settings have been updated successfully and are now live across the site.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update site settings",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSetting = async (key: string) => {
    const value = formData[key] || getCurrentValue(key);
    if (value !== getCurrentValue(key)) {
      updateSettingMutation.mutate({ key, value });
    }
  };

  const getCurrentValue = (key: string) => {
    return settings?.find(setting => setting.key === key)?.value || '';
  };

  const getFormValue = (key: string) => {
    return formData[key] !== undefined ? formData[key] : getCurrentValue(key);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Site Settings</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Site Settings</h1>
        <p className="text-muted-foreground">
          Configure global site settings that apply immediately across all pages.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Site Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Site Identity
            </CardTitle>
            <CardDescription>
              Basic site information and branding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="site-name">Site Name</Label>
              <div className="flex gap-2">
                <Input
                  id="site-name"
                  value={getFormValue('site_name')}
                  onChange={(e) => handleInputChange('site_name', e.target.value)}
                  placeholder="My Manga Site"
                  data-testid="input-site-name"
                />
                <Button 
                  onClick={() => handleSaveSetting('site_name')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  data-testid="button-save-site-name"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="site-description">Site Description</Label>
              <div className="flex gap-2">
                <Textarea
                  id="site-description"
                  value={getFormValue('site_description')}
                  onChange={(e) => handleInputChange('site_description', e.target.value)}
                  placeholder="The best place to read manga online"
                  rows={3}
                  data-testid="input-site-description"
                />
                <Button 
                  onClick={() => handleSaveSetting('site_description')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  data-testid="button-save-site-description"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="header-logo">Header Logo URL</Label>
              <div className="flex gap-2">
                <Input
                  id="header-logo"
                  value={getFormValue('header_logo')}
                  onChange={(e) => handleInputChange('header_logo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  data-testid="input-header-logo"
                />
                <Button 
                  onClick={() => handleSaveSetting('header_logo')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  data-testid="button-save-header-logo"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              SEO Configuration
            </CardTitle>
            <CardDescription>
              Search engine optimization settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="meta-title">Default Meta Title</Label>
              <div className="flex gap-2">
                <Input
                  id="meta-title"
                  value={getFormValue('meta_title')}
                  onChange={(e) => handleInputChange('meta_title', e.target.value)}
                  placeholder="My Manga Site - Read Manga Online"
                  data-testid="input-meta-title"
                />
                <Button 
                  onClick={() => handleSaveSetting('meta_title')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  data-testid="button-save-meta-title"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="meta-description">Default Meta Description</Label>
              <div className="flex gap-2">
                <Textarea
                  id="meta-description"
                  value={getFormValue('meta_description')}
                  onChange={(e) => handleInputChange('meta_description', e.target.value)}
                  placeholder="Read your favorite manga online for free with high-quality images and fast updates."
                  rows={3}
                  data-testid="input-meta-description"
                />
                <Button 
                  onClick={() => handleSaveSetting('meta_description')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  data-testid="button-save-meta-description"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="og-image">Open Graph Default Image</Label>
              <div className="flex gap-2">
                <Input
                  id="og-image"
                  value={getFormValue('og_image')}
                  onChange={(e) => handleInputChange('og_image', e.target.value)}
                  placeholder="https://example.com/og-image.jpg"
                  data-testid="input-og-image"
                />
                <Button 
                  onClick={() => handleSaveSetting('og_image')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  data-testid="button-save-og-image"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme & Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Theme & Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of your site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="primary-color">Primary Color (Hex)</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  value={getFormValue('primary_color')}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  placeholder="#007bff"
                  data-testid="input-primary-color"
                />
                <Button 
                  onClick={() => handleSaveSetting('primary_color')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  data-testid="button-save-primary-color"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="footer-text">Footer Text</Label>
              <div className="flex gap-2">
                <Input
                  id="footer-text"
                  value={getFormValue('footer_text')}
                  onChange={(e) => handleInputChange('footer_text', e.target.value)}
                  placeholder="© 2024 My Manga Site. All rights reserved."
                  data-testid="input-footer-text"
                />
                <Button 
                  onClick={() => handleSaveSetting('footer_text')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  data-testid="button-save-footer-text"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Social */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Contact & Social
            </CardTitle>
            <CardDescription>
              Contact information and social media links
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contact-email">Contact Email</Label>
              <div className="flex gap-2">
                <Input
                  id="contact-email"
                  type="email"
                  value={getFormValue('contact_email')}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder="contact@mysite.com"
                  data-testid="input-contact-email"
                />
                <Button 
                  onClick={() => handleSaveSetting('contact_email')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  data-testid="button-save-contact-email"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="twitter-url">Twitter/X URL</Label>
              <div className="flex gap-2">
                <Input
                  id="twitter-url"
                  value={getFormValue('twitter_url')}
                  onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                  placeholder="https://twitter.com/mysite"
                  data-testid="input-twitter-url"
                />
                <Button 
                  onClick={() => handleSaveSetting('twitter_url')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  data-testid="button-save-twitter-url"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="facebook-url">Facebook URL</Label>
              <div className="flex gap-2">
                <Input
                  id="facebook-url"
                  value={getFormValue('facebook_url')}
                  onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                  placeholder="https://facebook.com/mysite"
                  data-testid="input-facebook-url"
                />
                <Button 
                  onClick={() => handleSaveSetting('facebook_url')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  data-testid="button-save-facebook-url"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="instagram-url">Instagram URL</Label>
              <div className="flex gap-2">
                <Input
                  id="instagram-url"
                  value={getFormValue('instagram_url')}
                  onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                  placeholder="https://instagram.com/mysite"
                  data-testid="input-instagram-url"
                />
                <Button 
                  onClick={() => handleSaveSetting('instagram_url')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  data-testid="button-save-instagram-url"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="whatsapp-url">WhatsApp URL</Label>
              <div className="flex gap-2">
                <Input
                  id="whatsapp-url"
                  value={getFormValue('whatsapp_url')}
                  onChange={(e) => handleInputChange('whatsapp_url', e.target.value)}
                  placeholder="https://wa.me/1234567890"
                  data-testid="input-whatsapp-url"
                />
                <Button 
                  onClick={() => handleSaveSetting('whatsapp_url')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  data-testid="button-save-whatsapp-url"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="footer-custom-message">Custom Footer Message</Label>
              <div className="flex gap-2">
                <Textarea
                  id="footer-custom-message"
                  value={getFormValue('footer_custom_message')}
                  onChange={(e) => handleInputChange('footer_custom_message', e.target.value)}
                  placeholder="Optional message to display above copyright text"
                  rows={2}
                  data-testid="input-footer-custom-message"
                />
                <Button 
                  onClick={() => handleSaveSetting('footer_custom_message')}
                  disabled={updateSettingMutation.isPending}
                  size="sm"
                  data-testid="button-save-footer-custom-message"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}