import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { ApiConfiguration } from "@/lib/types";

interface ApiConfigForm {
  name: string;
  baseUrl: string;
  enabled: boolean;
  priority: number;
  endpoints: string;
}

export default function AdminApiConfig() {
  const [selectedConfig, setSelectedConfig] = useState<ApiConfiguration | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: configurations, isLoading } = useQuery({
    queryKey: ["/api/admin/api-config"],
    queryFn: adminApi.getApiConfigurations,
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<ApiConfigForm>({
    defaultValues: {
      name: "",
      baseUrl: "",
      enabled: true,
      priority: 1,
      endpoints: JSON.stringify({
        listManga: "/manga?order[updatedAt]=desc&limit={limit}&offset={offset}",
        mangaDetail: "/manga/{mangaId}?includes[]=cover_art&includes[]=author&includes[]=artist",
        chapterList: "/chapter?manga[]={mangaId}&translatedLanguage[]={lang}&order[chapter]=desc",
        chapterAtHome: "/at-home/server/{chapterId}"
      }, null, 2),
    },
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createApiConfiguration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-config"] });
      toast({ title: "API configuration created successfully" });
      setIsDialogOpen(false);
      reset();
    },
    onError: () => {
      toast({ title: "Failed to create API configuration", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<ApiConfiguration>) =>
      adminApi.updateApiConfiguration(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-config"] });
      toast({ title: "API configuration updated successfully" });
      setIsDialogOpen(false);
      setSelectedConfig(null);
      reset();
    },
    onError: () => {
      toast({ title: "Failed to update API configuration", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteApiConfiguration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-config"] });
      toast({ title: "API configuration deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete API configuration", variant: "destructive" });
    },
  });

  const handleEdit = (config: ApiConfiguration) => {
    setSelectedConfig(config);
    setValue("name", config.name);
    setValue("baseUrl", config.baseUrl);
    setValue("enabled", config.enabled);
    setValue("priority", config.priority);
    setValue("endpoints", JSON.stringify(config.endpoints, null, 2));
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this API configuration?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: ApiConfigForm) => {
    try {
      const endpoints = JSON.parse(data.endpoints);
      const configData = {
        ...data,
        endpoints,
      };

      if (selectedConfig) {
        updateMutation.mutate({ id: selectedConfig.id, ...configData });
      } else {
        createMutation.mutate(configData);
      }
    } catch (error) {
      toast({ title: "Invalid JSON in endpoints", variant: "destructive" });
    }
  };

  const testConnection = async (config: ApiConfiguration) => {
    try {
      // Simple test by making a request to the base URL
      const response = await fetch(config.baseUrl);
      if (response.ok) {
        toast({ title: "Connection successful" });
      } else {
        toast({ title: "Connection failed", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Connection failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8" data-testid="admin-api-config">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="api-config-title">
            API Configuration
          </h1>
          <p className="text-muted-foreground" data-testid="api-config-description">
            Manage your manga API sources and endpoints
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setSelectedConfig(null);
                reset();
              }}
              data-testid="add-api-config-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add API Source
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedConfig ? "Edit API Configuration" : "Add API Configuration"}
              </DialogTitle>
              <DialogDescription>
                Configure a new manga API source with custom endpoints
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="api-config-form">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  {...register("name", { required: true })}
                  placeholder="e.g., MangaDx"
                  data-testid="api-name-input"
                />
              </div>
              
              <div>
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input 
                  id="baseUrl" 
                  {...register("baseUrl", { required: true })}
                  placeholder="https://api.mangadx.org"
                  data-testid="api-base-url-input"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input 
                    id="priority" 
                    type="number" 
                    {...register("priority", { valueAsNumber: true })}
                    data-testid="api-priority-input"
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-6">
                  <Switch 
                    checked={watch("enabled")} 
                    onCheckedChange={(checked) => setValue("enabled", checked)}
                    data-testid="api-enabled-switch"
                  />
                  <Label>Enabled</Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="endpoints">Endpoints (JSON)</Label>
                <Textarea 
                  id="endpoints" 
                  {...register("endpoints", { required: true })}
                  rows={10}
                  className="font-mono text-sm"
                  data-testid="api-endpoints-textarea"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Define API endpoints as JSON with placeholders like {"{limit}"}, {"{offset}"}, {"{mangaId}"}
                </p>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="cancel-api-config"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="save-api-config"
                >
                  {selectedConfig ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* API Configurations List */}
      {isLoading ? (
        <div className="space-y-4" data-testid="api-config-loading">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="bg-muted rounded h-16 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4" data-testid="api-config-list">
          {configurations?.map((config) => (
            <Card key={config.id} data-testid={`api-config-${config.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${config.enabled ? "bg-green-400" : "bg-gray-400"}`} />
                    <CardTitle>{config.name}</CardTitle>
                    <Badge variant="outline">Priority {config.priority}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection(config)}
                      data-testid={`test-connection-${config.id}`}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(config)}
                      data-testid={`edit-api-config-${config.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(config.id)}
                      data-testid={`delete-api-config-${config.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{config.baseUrl}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>Status: {config.enabled ? "Active" : "Disabled"}</span>
                  <span>•</span>
                  <span>Last Updated: {new Date(config.updatedAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{Object.keys(config.endpoints).length} endpoints configured</span>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {configurations?.length === 0 && (
            <Card data-testid="no-api-configs">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">No API Configurations</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first API source to start fetching manga data
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add API Source
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
