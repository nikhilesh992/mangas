import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Eye, EyeOff, Upload } from "lucide-react";
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
import type { AdNetwork, CustomBanner } from "@/lib/types";

interface AdNetworkForm {
  name: string;
  script: string;
  enabled: boolean;
  slots: string[];
}

interface CustomBannerForm {
  name: string;
  imageUrl: string;
  linkUrl?: string;
  positions: string[];
  startDate?: string;
  endDate?: string;
  active: boolean;
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
  const [activeTab, setActiveTab] = useState("networks");
  const [selectedNetwork, setSelectedNetwork] = useState<AdNetwork | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<CustomBanner | null>(null);
  const [isNetworkDialogOpen, setIsNetworkDialogOpen] = useState(false);
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: networks, isLoading: networksLoading } = useQuery({
    queryKey: ["/api/admin/ad-networks"],
    queryFn: adminApi.getAdNetworks,
  });

  const { data: banners, isLoading: bannersLoading } = useQuery({
    queryKey: ["/api/admin/banners"],
    queryFn: adminApi.getBanners,
  });

  const {
    register: registerNetwork,
    handleSubmit: handleNetworkSubmit,
    reset: resetNetwork,
    setValue: setNetworkValue,
    watch: watchNetwork,
  } = useForm<AdNetworkForm>({
    defaultValues: {
      name: "",
      script: "",
      enabled: true,
      slots: [],
    },
  });

  const {
    register: registerBanner,
    handleSubmit: handleBannerSubmit,
    reset: resetBanner,
    setValue: setBannerValue,
    watch: watchBanner,
  } = useForm<CustomBannerForm>({
    defaultValues: {
      name: "",
      imageUrl: "",
      linkUrl: "",
      positions: [],
      active: true,
    },
  });

  // Ad Network Mutations
  const createNetworkMutation = useMutation({
    mutationFn: adminApi.createAdNetwork,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ad-networks"] });
      toast({ title: "Ad network created successfully" });
      setIsNetworkDialogOpen(false);
      resetNetwork();
    },
    onError: () => {
      toast({ title: "Failed to create ad network", variant: "destructive" });
    },
  });

  const updateNetworkMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<AdNetwork>) =>
      adminApi.updateAdNetwork(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ad-networks"] });
      toast({ title: "Ad network updated successfully" });
      setIsNetworkDialogOpen(false);
      setSelectedNetwork(null);
      resetNetwork();
    },
    onError: () => {
      toast({ title: "Failed to update ad network", variant: "destructive" });
    },
  });

  const deleteNetworkMutation = useMutation({
    mutationFn: adminApi.deleteAdNetwork,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ad-networks"] });
      toast({ title: "Ad network deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete ad network", variant: "destructive" });
    },
  });

  // Custom Banner Mutations
  const createBannerMutation = useMutation({
    mutationFn: adminApi.createBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      toast({ title: "Custom banner created successfully" });
      setIsBannerDialogOpen(false);
      resetBanner();
    },
    onError: () => {
      toast({ title: "Failed to create custom banner", variant: "destructive" });
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CustomBanner>) =>
      adminApi.updateBanner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      toast({ title: "Custom banner updated successfully" });
      setIsBannerDialogOpen(false);
      setSelectedBanner(null);
      resetBanner();
    },
    onError: () => {
      toast({ title: "Failed to update custom banner", variant: "destructive" });
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: adminApi.deleteBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      toast({ title: "Custom banner deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete custom banner", variant: "destructive" });
    },
  });

  // Handle Functions
  const handleEditNetwork = (network: AdNetwork) => {
    setSelectedNetwork(network);
    setNetworkValue("name", network.name);
    setNetworkValue("script", network.script);
    setNetworkValue("enabled", network.enabled);
    setNetworkValue("slots", network.slots);
    setIsNetworkDialogOpen(true);
  };

  const handleEditBanner = (banner: CustomBanner) => {
    setSelectedBanner(banner);
    setBannerValue("name", banner.name);
    setBannerValue("imageUrl", banner.imageUrl);
    setBannerValue("linkUrl", banner.linkUrl || "");
    setBannerValue("positions", banner.positions);
    setBannerValue("startDate", banner.startDate ? banner.startDate.split('T')[0] : "");
    setBannerValue("endDate", banner.endDate ? banner.endDate.split('T')[0] : "");
    setBannerValue("active", banner.active);
    setIsBannerDialogOpen(true);
  };

  const handleDeleteNetwork = (id: string) => {
    if (confirm("Are you sure you want to delete this ad network?")) {
      deleteNetworkMutation.mutate(id);
    }
  };

  const handleDeleteBanner = (id: string) => {
    if (confirm("Are you sure you want to delete this banner?")) {
      deleteBannerMutation.mutate(id);
    }
  };

  const onNetworkSubmit = (data: AdNetworkForm) => {
    if (selectedNetwork) {
      updateNetworkMutation.mutate({ id: selectedNetwork.id, ...data });
    } else {
      createNetworkMutation.mutate(data);
    }
  };

  const onBannerSubmit = (data: CustomBannerForm) => {
    const bannerData = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
    };

    if (selectedBanner) {
      updateBannerMutation.mutate({ id: selectedBanner.id, ...bannerData });
    } else {
      createBannerMutation.mutate(bannerData);
    }
  };

  const toggleSlot = (slot: string, isNetworkForm: boolean = true) => {
    if (isNetworkForm) {
      const currentSlots = watchNetwork("slots") || [];
      const newSlots = currentSlots.includes(slot)
        ? currentSlots.filter(s => s !== slot)
        : [...currentSlots, slot];
      setNetworkValue("slots", newSlots);
    } else {
      const currentPositions = watchBanner("positions") || [];
      const newPositions = currentPositions.includes(slot)
        ? currentPositions.filter(s => s !== slot)
        : [...currentPositions, slot];
      setBannerValue("positions", newPositions);
    }
  };

  return (
    <div className="space-y-8" data-testid="admin-ads">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="ads-title">
            Ad Management
          </h1>
          <p className="text-muted-foreground" data-testid="ads-description">
            Manage ad networks, custom banners, and ad placements
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="ads-tabs">
        <TabsList>
          <TabsTrigger value="networks" data-testid="networks-tab">Ad Networks</TabsTrigger>
          <TabsTrigger value="banners" data-testid="banners-tab">Custom Banners</TabsTrigger>
        </TabsList>

        <TabsContent value="networks" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-foreground">Ad Networks</h2>
            <Dialog open={isNetworkDialogOpen} onOpenChange={setIsNetworkDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setSelectedNetwork(null);
                    resetNetwork();
                  }}
                  data-testid="add-network-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Network
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedNetwork ? "Edit Ad Network" : "Add Ad Network"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure an ad network by pasting the script snippet
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleNetworkSubmit(onNetworkSubmit)} className="space-y-4" data-testid="network-form">
                  <div>
                    <Label htmlFor="network-name">Network Name</Label>
                    <Input 
                      id="network-name"
                      {...registerNetwork("name", { required: true })}
                      placeholder="e.g., Google AdSense"
                      data-testid="network-name-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="network-script">Ad Script</Label>
                    <Textarea 
                      id="network-script"
                      {...registerNetwork("script", { required: true })}
                      rows={6}
                      placeholder="Paste your ad network script here..."
                      data-testid="network-script-textarea"
                    />
                  </div>
                  
                  <div>
                    <Label>Ad Slots</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {AD_SLOTS.map((slot) => (
                        <div key={slot} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`slot-${slot}`}
                            checked={(watchNetwork("slots") || []).includes(slot)}
                            onChange={() => toggleSlot(slot, true)}
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
                      checked={watchNetwork("enabled")} 
                      onCheckedChange={(checked) => setNetworkValue("enabled", checked)}
                      data-testid="network-enabled-switch"
                    />
                    <Label>Enabled</Label>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsNetworkDialogOpen(false)}
                      data-testid="cancel-network"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createNetworkMutation.isPending || updateNetworkMutation.isPending}
                      data-testid="save-network"
                    >
                      {selectedNetwork ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {networksLoading ? (
            <div className="space-y-4" data-testid="networks-loading">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="bg-muted rounded h-16 animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4" data-testid="networks-list">
              {networks?.map((network) => (
                <Card key={network.id} data-testid={`network-${network.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${network.enabled ? "bg-green-400" : "bg-gray-400"}`} />
                        <CardTitle>{network.name}</CardTitle>
                        <Badge variant="outline">{network.slots.length} slots</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditNetwork(network)}
                          data-testid={`edit-network-${network.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteNetwork(network.id)}
                          data-testid={`delete-network-${network.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-2">Active slots: {network.slots.join(", ")}</p>
                      <p>Status: {network.enabled ? "Active" : "Disabled"}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {networks?.length === 0 && (
                <Card data-testid="no-networks">
                  <CardContent className="p-8 text-center">
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Ad Networks</h3>
                    <p className="text-muted-foreground mb-4">
                      Add your first ad network to start displaying ads
                    </p>
                    <Button onClick={() => setIsNetworkDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Network
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="banners" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-foreground">Custom Banners</h2>
            <Dialog open={isBannerDialogOpen} onOpenChange={setIsBannerDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setSelectedBanner(null);
                    resetBanner();
                  }}
                  data-testid="add-banner-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Banner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedBanner ? "Edit Custom Banner" : "Add Custom Banner"}
                  </DialogTitle>
                  <DialogDescription>
                    Create a custom banner advertisement
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleBannerSubmit(onBannerSubmit)} className="space-y-4" data-testid="banner-form">
                  <div>
                    <Label htmlFor="banner-name">Banner Name</Label>
                    <Input 
                      id="banner-name"
                      {...registerBanner("name", { required: true })}
                      placeholder="e.g., Homepage Promotion"
                      data-testid="banner-name-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="banner-image">Image URL</Label>
                    <Input 
                      id="banner-image"
                      {...registerBanner("imageUrl", { required: true })}
                      placeholder="https://example.com/banner.jpg"
                      data-testid="banner-image-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="banner-link">Link URL (optional)</Label>
                    <Input 
                      id="banner-link"
                      {...registerBanner("linkUrl")}
                      placeholder="https://example.com"
                      data-testid="banner-link-input"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="banner-start">Start Date (optional)</Label>
                      <Input 
                        id="banner-start"
                        type="date"
                        {...registerBanner("startDate")}
                        data-testid="banner-start-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="banner-end">End Date (optional)</Label>
                      <Input 
                        id="banner-end"
                        type="date"
                        {...registerBanner("endDate")}
                        data-testid="banner-end-input"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Positions</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {AD_SLOTS.map((slot) => (
                        <div key={slot} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`banner-slot-${slot}`}
                            checked={(watchBanner("positions") || []).includes(slot)}
                            onChange={() => toggleSlot(slot, false)}
                            data-testid={`banner-slot-${slot}`}
                          />
                          <Label htmlFor={`banner-slot-${slot}`} className="text-sm">
                            {slot.replace(/_/g, ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={watchBanner("active")} 
                      onCheckedChange={(checked) => setBannerValue("active", checked)}
                      data-testid="banner-active-switch"
                    />
                    <Label>Active</Label>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsBannerDialogOpen(false)}
                      data-testid="cancel-banner"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createBannerMutation.isPending || updateBannerMutation.isPending}
                      data-testid="save-banner"
                    >
                      {selectedBanner ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {bannersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="banners-loading">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="bg-muted rounded h-32 mb-4 animate-pulse" />
                    <div className="bg-muted rounded h-4 animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="banners-list">
              {banners?.map((banner) => (
                <Card key={banner.id} data-testid={`banner-${banner.id}`}>
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <img
                        src={banner.imageUrl}
                        alt={banner.name}
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-banner.jpg";
                        }}
                      />
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <Badge variant={banner.active ? "default" : "secondary"}>
                          {banner.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-foreground mb-2">{banner.name}</h3>
                    
                    <div className="text-sm text-muted-foreground space-y-1 mb-4">
                      <p>Positions: {banner.positions.length}</p>
                      <p>Impressions: {banner.impressions.toLocaleString()}</p>
                      <p>Clicks: {banner.clicks.toLocaleString()}</p>
                      {banner.clicks > 0 && (
                        <p>CTR: {((banner.clicks / banner.impressions) * 100).toFixed(2)}%</p>
                      )}
                    </div>
                    
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditBanner(banner)}
                        data-testid={`edit-banner-${banner.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteBanner(banner.id)}
                        data-testid={`delete-banner-${banner.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {banners?.length === 0 && (
                <div className="col-span-full">
                  <Card data-testid="no-banners">
                    <CardContent className="p-8 text-center">
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Custom Banners</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first custom banner advertisement
                      </p>
                      <Button onClick={() => setIsBannerDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Banner
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
