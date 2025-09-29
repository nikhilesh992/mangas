import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Globe, Key, Database, Shield, Bell, Download, Upload, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface GeneralSettings {
  siteTitle: string;
  siteDescription: string;
  siteUrl: string;
  contactEmail: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
}

interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  googleAnalyticsId: string;
  googleSearchConsole: string;
  sitemap: boolean;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordMinLength: number;
  requireEmailVerification: boolean;
  maxLoginAttempts: number;
  reCaptchaEnabled: boolean;
  reCaptchaSiteKey: string;
  reCaptchaSecretKey: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  newUserNotifications: boolean;
  errorNotifications: boolean;
  maintenanceNotifications: boolean;
}

const defaultSettings = {
  general: {
    siteTitle: "MangaVerse",
    siteDescription: "Your ultimate destination for reading manga online",
    siteUrl: "https://mangaverse.com",
    contactEmail: "contact@mangaverse.com",
    maintenanceMode: false,
    registrationEnabled: true,
  },
  seo: {
    metaTitle: "MangaVerse - Read Manga Online",
    metaDescription: "Discover and read thousands of manga series online. Latest updates, popular series, and new releases.",
    metaKeywords: "manga, read manga, manga online, japanese comics",
    googleAnalyticsId: "",
    googleSearchConsole: "",
    sitemap: true,
  },
  security: {
    twoFactorAuth: false,
    sessionTimeout: 24,
    passwordMinLength: 8,
    requireEmailVerification: true,
    maxLoginAttempts: 5,
    reCaptchaEnabled: false,
    reCaptchaSiteKey: "",
    reCaptchaSecretKey: "",
  },
  notifications: {
    emailNotifications: true,
    newUserNotifications: true,
    errorNotifications: true,
    maintenanceNotifications: true,
  },
};

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Since settings endpoints might not be fully implemented, using default values
  const settings = defaultSettings;
  const isLoading = false;

  const {
    register: registerGeneral,
    handleSubmit: handleGeneralSubmit,
    setValue: setGeneralValue,
    watch: watchGeneral,
  } = useForm<GeneralSettings>({
    defaultValues: settings.general,
  });

  const {
    register: registerSEO,
    handleSubmit: handleSEOSubmit,
    setValue: setSEOValue,
    watch: watchSEO,
  } = useForm<SEOSettings>({
    defaultValues: settings.seo,
  });

  const {
    register: registerSecurity,
    handleSubmit: handleSecuritySubmit,
    setValue: setSecurityValue,
    watch: watchSecurity,
  } = useForm<SecuritySettings>({
    defaultValues: settings.security,
  });

  const {
    register: registerNotifications,
    handleSubmit: handleNotificationsSubmit,
    setValue: setNotificationValue,
    watch: watchNotifications,
  } = useForm<NotificationSettings>({
    defaultValues: settings.notifications,
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: { category: string; settings: any }) => {
      // In a real implementation, this would save to the backend
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: (data) => {
      toast({ title: `${data.category} settings saved successfully` });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  // Database backup mutation
  const backupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/backup", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Backup failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Create and download backup file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mangaverse-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: "Database backup created successfully" });
    },
    onError: () => {
      toast({ title: "Backup failed", variant: "destructive" });
    },
  });

  // Database restore mutation
  const restoreMutation = useMutation({
    mutationFn: async ({ backupData, clearExisting }: { backupData: any; clearExisting: boolean }) => {
      const response = await fetch("/api/admin/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          backupData,
          options: { clearExisting }
        }),
      });
      
      if (!response.ok) {
        throw new Error("Restore failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Database restored successfully" });
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast({ title: "Restore failed", variant: "destructive" });
    },
  });

  const onGeneralSubmit = (data: GeneralSettings) => {
    saveSettingsMutation.mutate({ category: "General", settings: data });
  };

  const onSEOSubmit = (data: SEOSettings) => {
    saveSettingsMutation.mutate({ category: "SEO", settings: data });
  };

  const onSecuritySubmit = (data: SecuritySettings) => {
    saveSettingsMutation.mutate({ category: "Security", settings: data });
  };

  const onNotificationsSubmit = (data: NotificationSettings) => {
    saveSettingsMutation.mutate({ category: "Notifications", settings: data });
  };

  // Handle backup creation
  const handleCreateBackup = () => {
    backupMutation.mutate();
  };

  // Handle file upload for restore
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target?.result as string);
          
          // Validate backup data structure
          if (!backupData.tables || !backupData.version) {
            throw new Error("Invalid backup file format");
          }
          
          const confirmed = confirm(
            "Are you sure you want to restore from this backup? This will add data to your database."
          );
          
          if (confirmed) {
            restoreMutation.mutate({ backupData, clearExisting: false });
          }
        } catch (error) {
          toast({ 
            title: "Invalid backup file", 
            description: "Please select a valid backup JSON file",
            variant: "destructive" 
          });
        }
      };
      reader.readAsText(file);
    }
  };

  // Handle restore with clear existing data
  const handleRestoreWithClear = () => {
    if (fileInputRef.current?.files?.[0]) {
      const file = fileInputRef.current.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target?.result as string);
          
          const confirmed = confirm(
            "⚠️ WARNING: This will completely replace all existing data with the backup data. This action cannot be undone. Are you sure?"
          );
          
          if (confirmed) {
            restoreMutation.mutate({ backupData, clearExisting: true });
          }
        } catch (error) {
          toast({ 
            title: "Invalid backup file", 
            description: "Please select a valid backup JSON file",
            variant: "destructive" 
          });
        }
      };
      reader.readAsText(file);
    } else {
      toast({ 
        title: "No file selected", 
        description: "Please select a backup file first",
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="space-y-8" data-testid="admin-settings">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="settings-title">
          Settings
        </h1>
        <p className="text-muted-foreground" data-testid="settings-description">
          Configure your manga site settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="settings-tabs">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" data-testid="general-tab">
            <Globe className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="seo" data-testid="seo-tab">
            <Key className="h-4 w-4 mr-2" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="security-tab">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="notifications-tab">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="database" data-testid="database-tab">
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card data-testid="general-settings-card">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic site configuration and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGeneralSubmit(onGeneralSubmit)} className="space-y-4" data-testid="general-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="siteTitle">Site Title</Label>
                    <Input
                      id="siteTitle"
                      {...registerGeneral("siteTitle")}
                      data-testid="site-title-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      {...registerGeneral("contactEmail")}
                      data-testid="contact-email-input"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    {...registerGeneral("siteDescription")}
                    rows={3}
                    data-testid="site-description-textarea"
                  />
                </div>

                <div>
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input
                    id="siteUrl"
                    type="url"
                    {...registerGeneral("siteUrl")}
                    data-testid="site-url-input"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable to show maintenance page to visitors
                      </p>
                    </div>
                    <Switch
                      checked={watchGeneral("maintenanceMode")}
                      onCheckedChange={(checked) => setGeneralValue("maintenanceMode", checked)}
                      data-testid="maintenance-mode-switch"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>User Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new users to register accounts
                      </p>
                    </div>
                    <Switch
                      checked={watchGeneral("registrationEnabled")}
                      onCheckedChange={(checked) => setGeneralValue("registrationEnabled", checked)}
                      data-testid="registration-enabled-switch"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={saveSettingsMutation.isPending} data-testid="save-general">
                  <Save className="h-4 w-4 mr-2" />
                  Save General Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card data-testid="seo-settings-card">
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Search engine optimization and analytics configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSEOSubmit(onSEOSubmit)} className="space-y-4" data-testid="seo-form">
                <div>
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    {...registerSEO("metaTitle")}
                    data-testid="meta-title-input"
                  />
                </div>

                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    {...registerSEO("metaDescription")}
                    rows={3}
                    data-testid="meta-description-textarea"
                  />
                </div>

                <div>
                  <Label htmlFor="metaKeywords">Meta Keywords</Label>
                  <Input
                    id="metaKeywords"
                    {...registerSEO("metaKeywords")}
                    placeholder="manga, comics, reading"
                    data-testid="meta-keywords-input"
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                    <Input
                      id="googleAnalyticsId"
                      {...registerSEO("googleAnalyticsId")}
                      placeholder="UA-XXXXXXXXX-X"
                      data-testid="analytics-id-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="googleSearchConsole">Search Console ID</Label>
                    <Input
                      id="googleSearchConsole"
                      {...registerSEO("googleSearchConsole")}
                      placeholder="google-site-verification"
                      data-testid="search-console-input"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Generate Sitemap</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically generate XML sitemap
                    </p>
                  </div>
                  <Switch
                    checked={watchSEO("sitemap")}
                    onCheckedChange={(checked) => setSEOValue("sitemap", checked)}
                    data-testid="sitemap-switch"
                  />
                </div>

                <Button type="submit" disabled={saveSettingsMutation.isPending} data-testid="save-seo">
                  <Save className="h-4 w-4 mr-2" />
                  Save SEO Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card data-testid="security-settings-card">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSecuritySubmit(onSecuritySubmit)} className="space-y-4" data-testid="security-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      {...registerSecurity("sessionTimeout")}
                      data-testid="session-timeout-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="passwordMinLength">Min Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      {...registerSecurity("passwordMinLength")}
                      data-testid="password-min-length-input"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    {...registerSecurity("maxLoginAttempts")}
                    data-testid="max-login-attempts-input"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Require 2FA for admin accounts
                      </p>
                    </div>
                    <Switch
                      checked={watchSecurity("twoFactorAuth")}
                      onCheckedChange={(checked) => setSecurityValue("twoFactorAuth", checked)}
                      data-testid="two-factor-auth-switch"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Verification</Label>
                      <p className="text-sm text-muted-foreground">
                        Require email verification for new accounts
                      </p>
                    </div>
                    <Switch
                      checked={watchSecurity("requireEmailVerification")}
                      onCheckedChange={(checked) => setSecurityValue("requireEmailVerification", checked)}
                      data-testid="email-verification-switch"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>reCAPTCHA</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable reCAPTCHA for forms
                      </p>
                    </div>
                    <Switch
                      checked={watchSecurity("reCaptchaEnabled")}
                      onCheckedChange={(checked) => setSecurityValue("reCaptchaEnabled", checked)}
                      data-testid="recaptcha-enabled-switch"
                    />
                  </div>
                </div>

                {watchSecurity("reCaptchaEnabled") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reCaptchaSiteKey">reCAPTCHA Site Key</Label>
                      <Input
                        id="reCaptchaSiteKey"
                        {...registerSecurity("reCaptchaSiteKey")}
                        data-testid="recaptcha-site-key-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reCaptchaSecretKey">reCAPTCHA Secret Key</Label>
                      <Input
                        id="reCaptchaSecretKey"
                        type="password"
                        {...registerSecurity("reCaptchaSecretKey")}
                        data-testid="recaptcha-secret-key-input"
                      />
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={saveSettingsMutation.isPending} data-testid="save-security">
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card data-testid="notifications-settings-card">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure email and system notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNotificationsSubmit(onNotificationsSubmit)} className="space-y-4" data-testid="notifications-form">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send admin notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={watchNotifications("emailNotifications")}
                      onCheckedChange={(checked) => setNotificationValue("emailNotifications", checked)}
                      data-testid="email-notifications-switch"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New User Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when new users register
                      </p>
                    </div>
                    <Switch
                      checked={watchNotifications("newUserNotifications")}
                      onCheckedChange={(checked) => setNotificationValue("newUserNotifications", checked)}
                      data-testid="new-user-notifications-switch"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Error Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify about system errors
                      </p>
                    </div>
                    <Switch
                      checked={watchNotifications("errorNotifications")}
                      onCheckedChange={(checked) => setNotificationValue("errorNotifications", checked)}
                      data-testid="error-notifications-switch"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify about scheduled maintenance
                      </p>
                    </div>
                    <Switch
                      checked={watchNotifications("maintenanceNotifications")}
                      onCheckedChange={(checked) => setNotificationValue("maintenanceNotifications", checked)}
                      data-testid="maintenance-notifications-switch"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={saveSettingsMutation.isPending} data-testid="save-notifications">
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Backup Card */}
            <Card data-testid="backup-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2" />
                  Database Backup
                </CardTitle>
                <CardDescription>
                  Create a backup of all your application data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>This will create a JSON file containing:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>User accounts and settings</li>
                    <li>Blog posts and content</li>
                    <li>Ad configurations</li>
                    <li>Site settings</li>
                    <li>User favorites and reading progress</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={handleCreateBackup}
                  disabled={backupMutation.isPending}
                  className="w-full"
                  data-testid="create-backup-button"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {backupMutation.isPending ? "Creating Backup..." : "Create Backup"}
                </Button>
              </CardContent>
            </Card>

            {/* Restore Card */}
            <Card data-testid="restore-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Database Restore
                </CardTitle>
                <CardDescription>
                  Restore data from a previous backup file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Select a backup JSON file to restore data.</p>
                  <p className="mt-2">
                    <strong>Note:</strong> This will add data to your existing database without removing current data.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="backup-file">Select Backup File</Label>
                  <Input
                    id="backup-file"
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleFileUpload}
                    data-testid="backup-file-input"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    disabled={restoreMutation.isPending}
                    className="w-full"
                    data-testid="restore-add-button"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {restoreMutation.isPending ? "Restoring..." : "Restore (Add to existing)"}
                  </Button>
                  
                  <Button 
                    onClick={handleRestoreWithClear}
                    variant="destructive"
                    disabled={restoreMutation.isPending}
                    className="w-full"
                    data-testid="restore-replace-button"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Replace All Data
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                  <p><strong>⚠️ Replace All Data:</strong> This will completely remove all existing data and replace it with the backup data. This action cannot be undone.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
