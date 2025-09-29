import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, Network, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Ad } from "@/lib/types";

interface AdForm {
  networkName?: string;
  adScript?: string;
  bannerImage?: string;
  bannerLink?: string;
  width: number;
  height: number;
  slots: string[];
  enabled: boolean;
}

const AD_SLOTS = [
  "homepage_top",
  "homepage_bottom", 
  "browse_top",
  "manga_detail_top",
  "manga_detail_inline",
  "reader_top",
  "reader_bottom",
  "blog_top",
  "blog_post_top",
  "blog_post_inline"
];

export default function AdminAds() {
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [isAdDialogOpen, setIsAdDialogOpen] = useState(false);
  const [adType, setAdType] = useState<"network" | "banner">("network");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ads, isLoading: adsLoading } = useQuery({
    queryKey: ["/api/admin/ads"],
    queryFn: adminApi.getAds,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<AdForm>({
    defaultValues: {
      networkName: "",
      adScript: "",
      bannerImage: "",
      bannerLink: "",
      width: 0,
      height: 0,
      slots: [],
      enabled: true,
    },
  });

  // Unified Ad Mutations
  const createAdMutation = useMutation({
    mutationFn: adminApi.createAd,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      toast({ title: "Ad created successfully" });
      setIsAdDialogOpen(false);
      reset();
    },
    onError: () => {
      toast({ title: "Failed to create ad", variant: "destructive" });
    },
  });

  const updateAdMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Ad>) =>
      adminApi.updateAd(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      toast({ title: "Ad updated successfully" });
      setIsAdDialogOpen(false);
      setSelectedAd(null);
      reset();
    },
    onError: () => {
      toast({ title: "Failed to update ad", variant: "destructive" });
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: adminApi.deleteAd,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      toast({ title: "Ad deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete ad", variant: "destructive" });
    },
  });

  // Handle Functions
  const handleEditAd = (ad: Ad) => {
    setSelectedAd(ad);
    setValue("networkName", ad.networkName || "");
    setValue("adScript", ad.adScript || "");
    setValue("bannerImage", ad.bannerImage || "");
    setValue("bannerLink", ad.bannerLink || "");
    setValue("width", ad.width || 0);
    setValue("height", ad.height || 0);
    setValue("slots", ad.slots || []);
    setValue("enabled", ad.enabled);
    
    // Determine ad type based on content
    if (ad.adScript) {
      setAdType("network");
    } else if (ad.bannerImage) {
      setAdType("banner");
    }
    
    setIsAdDialogOpen(true);
  };

  const handleDeleteAd = (id: number) => {
    if (confirm("Are you sure you want to delete this ad?")) {
      deleteAdMutation.mutate(id);
    }
  };

  const onAdSubmit = (data: AdForm) => {
    if (selectedAd) {
      updateAdMutation.mutate({ id: selectedAd.id, ...data });
    } else {
      createAdMutation.mutate(data);
    }
  };

  const toggleSlot = (slot: string) => {
    const currentSlots = watch("slots") || [];
    const newSlots = currentSlots.includes(slot)
      ? currentSlots.filter(s => s !== slot)
      : [...currentSlots, slot];
    setValue("slots", newSlots);
  };

  return (
    <div className="space-y-8" data-testid="admin-ads">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="ads-title">
            Ad Management
          </h1>
          <p className="text-muted-foreground" data-testid="ads-description">
            Unified management for ad networks and banner ads
          </p>
        </div>
        <Dialog open={isAdDialogOpen} onOpenChange={setIsAdDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setSelectedAd(null);
                reset();
                setAdType("network");
              }}
              data-testid="add-ad-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Ad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedAd ? "Edit Ad" : "Add Ad"}
              </DialogTitle>
              <DialogDescription>
                Create network ads or banner ads for your site
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onAdSubmit)} className="space-y-4" data-testid="ad-form">
              <div>
                <Label>Ad Type</Label>
                <Select value={adType} onValueChange={(value: "network" | "banner") => setAdType(value)} data-testid="ad-type-select">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="network">
                      <div className="flex items-center">
                        <Network className="h-4 w-4 mr-2" />
                        Ad Network (Script)
                      </div>
                    </SelectItem>
                    <SelectItem value="banner">
                      <div className="flex items-center">
                        <Image className="h-4 w-4 mr-2" />
                        Banner Ad (Image)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {adType === "network" ? (
                <>
                  <div>
                    <Label htmlFor="network-name">Network Name</Label>
                    <Input 
                      id="network-name"
                      {...register("networkName", { required: true })}
                      placeholder="e.g., Google AdSense, Adsterra"
                      data-testid="network-name-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="ad-script">Ad Script</Label>
                    <Textarea 
                      id="ad-script"
                      {...register("adScript", { required: true })}
                      rows={6}
                      placeholder="Paste your ad network script here..."
                      data-testid="ad-script-textarea"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="network-width">Width (pixels)</Label>
                      <Input 
                        id="network-width"
                        type="number"
                        min="0"
                        {...register("width", { valueAsNumber: true })}
                        placeholder="0 = default size"
                        data-testid="network-width-input"
                      />
                      <p className="text-xs text-muted-foreground mt-1">0 means use default size</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="network-height">Height (pixels)</Label>
                      <Input 
                        id="network-height"
                        type="number"
                        min="0"
                        {...register("height", { valueAsNumber: true })}
                        placeholder="0 = default size"
                        data-testid="network-height-input"
                      />
                      <p className="text-xs text-muted-foreground mt-1">0 means use default size</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="banner-image">Banner Image URL</Label>
                    <Input 
                      id="banner-image"
                      {...register("bannerImage", { required: true })}
                      placeholder="https://example.com/banner.jpg"
                      data-testid="banner-image-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="banner-link">Banner Link (Optional)</Label>
                    <Input 
                      id="banner-link"
                      {...register("bannerLink")}
                      placeholder="https://example.com/landing-page"
                      data-testid="banner-link-input"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="banner-width">Width (pixels)</Label>
                      <Input 
                        id="banner-width"
                        type="number"
                        min="0"
                        {...register("width", { valueAsNumber: true })}
                        placeholder="0 = default size"
                        data-testid="banner-width-input"
                      />
                      <p className="text-xs text-muted-foreground mt-1">0 means use default size</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="banner-height">Height (pixels)</Label>
                      <Input 
                        id="banner-height"
                        type="number"
                        min="0"
                        {...register("height", { valueAsNumber: true })}
                        placeholder="0 = default size"
                        data-testid="banner-height-input"
                      />
                      <p className="text-xs text-muted-foreground mt-1">0 means use default size</p>
                    </div>
                  </div>
                </>
              )}
              
              <div>
                <Label>Ad Slots</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {AD_SLOTS.map((slot) => (
                    <div key={slot} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`slot-${slot}`}
                        checked={(watch("slots") || []).includes(slot)}
                        onChange={() => toggleSlot(slot)}
                        data-testid={`slot-${slot}`}
                      />
                      <Label htmlFor={`slot-${slot}`} className="text-sm">
                        {slot.replace(/_/g, ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={watch("enabled")} 
                  onCheckedChange={(checked) => setValue("enabled", checked)}
                  data-testid="ad-enabled-switch"
                />
                <Label>Enabled</Label>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAdDialogOpen(false)}
                  data-testid="cancel-ad"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createAdMutation.isPending || updateAdMutation.isPending}
                  data-testid="submit-ad"
                >
                  {selectedAd ? "Update Ad" : "Create Ad"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ad List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Active Ads</h2>
        
        {adsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : ads && ads.length > 0 ? (
          <div className="grid gap-4">
            {ads.map((ad) => (
              <Card key={ad.id} data-testid={`ad-card-${ad.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {ad.adScript ? (
                        <Network className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Image className="h-5 w-5 text-green-500" />
                      )}
                      <div>
                        <CardTitle className="text-lg" data-testid={`ad-title-${ad.id}`}>
                          {ad.networkName || "Banner Ad"}
                        </CardTitle>
                        <CardDescription data-testid={`ad-type-${ad.id}`}>
                          {ad.adScript ? "Network Ad" : "Banner Ad"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={ad.enabled ? "default" : "secondary"}
                        data-testid={`ad-status-${ad.id}`}
                      >
                        {ad.enabled ? (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Enabled
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Disabled
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {ad.slots && ad.slots.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Slots:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ad.slots.map((slot) => (
                            <Badge key={slot} variant="outline" className="text-xs">
                              {slot.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {ad.bannerImage && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Banner:</span>
                        <div className="mt-1">
                          <img 
                            src={ad.bannerImage} 
                            alt="Banner preview"
                            className="h-16 object-cover rounded border"
                            data-testid={`ad-banner-${ad.id}`}
                          />
                        </div>
                      </div>
                    )}
                    
                    {((ad.width && ad.width > 0) || (ad.height && ad.height > 0)) && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Dimensions:</span>
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">
                            {ad.width || 'auto'} × {ad.height || 'auto'} px
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAd(ad)}
                        data-testid={`edit-ad-${ad.id}`}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAd(ad.id)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`delete-ad-${ad.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium">No ads configured</h3>
                <p className="text-sm text-muted-foreground">
                  Add your first ad to get started with monetization
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
