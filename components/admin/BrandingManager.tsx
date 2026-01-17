"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Eye, Settings, Monitor, Bell, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/use-notifications";

interface BrandingSettings {
  site_name: string;
  site_description: string;
  logo_url: string;
  favicon_url: string;
}

export function BrandingManager() {
  const [settings, setSettings] = useState<BrandingSettings>({
    site_name: "",
    site_description: "",
    logo_url: "",
    favicon_url: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { 
    isSupported: isNotificationSupported, 
    permission, 
    isEnabled, 
    requestPermission, 
    showNotification 
  } = useNotifications();

  // Fetch current settings
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/site-settings");
      
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
      
      const data = await response.json();
      const { site_name, site_description, logo_url, favicon_url } = data.settings;
      
      setSettings({ 
        site_name: site_name || "",
        site_description: site_description || "",
        logo_url: logo_url || "",
        favicon_url: favicon_url || "",
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load branding settings");
    } finally {
      setIsLoading(false);
    }
  };

  // Load settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle input changes
  const handleInputChange = (field: keyof BrandingSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save settings
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('site-settings-updated', {
        detail: settings
      }));

      toast.success("Branding settings saved successfully!");

      // Show notification if enabled
      if (isNotificationSupported && isEnabled) {
        showNotification({
          title: "Settings Updated",
          body: "Your branding settings have been saved",
          icon: '/logo.svg',
        });
      }

    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save branding settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Site Branding</h2>
          <p className="text-sm text-muted-foreground">
            Customize your site name and description. Logo and favicon are managed through files in the public folder.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isNotificationSupported && (
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Badge variant={isEnabled ? "default" : "secondary"} className="text-xs">
                Notifications {isEnabled ? "On" : "Off"}
              </Badge>
              {!isEnabled && permission === "default" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={requestPermission}
                >
                  Enable
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Logo and Favicon Manual Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Logo & Favicon
          </CardTitle>
          <CardDescription>
            Manage your logo and favicon files directly in the public folder
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Instructions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Site Logo</Label>
                <Badge variant="outline" className="text-xs">Manual Upload</Badge>
              </div>
              <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                <p className="text-sm text-muted-foreground">
                  To set your logo, add your image file to the <code className="px-1.5 py-0.5 bg-muted rounded text-xs">public</code> folder:
                </p>
                <div className="bg-background border rounded p-3 font-mono text-xs space-y-1">
                  <div className="text-muted-foreground">1. Place your logo file in:</div>
                  <div className="text-foreground"><code>public/logo.svg</code></div>
                  <div className="text-muted-foreground mt-2">2. Or any custom name:</div>
                  <div className="text-foreground"><code>public/your-logo.svg</code></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Recommended: PNG or SVG format, transparent background, 200x50px
                </p>
                {settings.logo_url && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Current logo:</p>
                    <img 
                      src={settings.logo_url} 
                      alt="Current logo" 
                      className="max-h-12 border rounded p-2 bg-background"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Favicon Instructions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Favicon</Label>
                <Badge variant="outline" className="text-xs">Manual Upload</Badge>
              </div>
              <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                <p className="text-sm text-muted-foreground">
                  To set your favicon, add your icon file to the <code className="px-1.5 py-0.5 bg-muted rounded text-xs">public</code> folder:
                </p>
                <div className="bg-background border rounded p-3 font-mono text-xs space-y-1">
                  <div className="text-muted-foreground">1. Place your favicon file in:</div>
                  <div className="text-foreground"><code>public/favicon.ico</code></div>
                  <div className="text-muted-foreground mt-2">2. Or use PNG format:</div>
                  <div className="text-foreground"><code>public/favicon.png</code></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Recommended: ICO or PNG format, 32x32px or 16x16px
                </p>
                {settings.favicon_url && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Current favicon:</p>
                    <img 
                      src={settings.favicon_url} 
                      alt="Current favicon" 
                      className="w-8 h-8 border rounded p-1 bg-background"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Note:</strong> After adding files to the public folder, restart your development server (<code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">pnpm dev</code>) to see the changes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Site Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Site Information
          </CardTitle>
          <CardDescription>
            Configure your site's basic information and branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
            </div>
          ) : (
            <div className="grid gap-4">
              {/* Site Name */}
              <div className="space-y-2">
                <Label htmlFor="site_name" className="text-sm font-medium">
                  Site Name *
                </Label>
                <Input
                  id="site_name"
                  type="text"
                  value={settings.site_name}
                  onChange={(e) => handleInputChange('site_name', e.target.value)}
                  placeholder="e.g., LMS Showcase"
                  className="max-w-md"
                />
                <p className="text-xs text-muted-foreground">
                  This appears in the browser title, navigation, and throughout the site
                </p>
              </div>

              {/* Site Description */}
              <div className="space-y-2">
                <Label htmlFor="site_description" className="text-sm font-medium">
                  Site Description *
                </Label>
                <Input
                  id="site_description"
                  type="text"
                  value={settings.site_description}
                  onChange={(e) => handleInputChange('site_description', e.target.value)}
                  placeholder="e.g., Explore Our Courses"
                  className="max-w-md"
                />
                <p className="text-xs text-muted-foreground">
                  Short description used in page titles and meta descriptions
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Changes are saved immediately after clicking Save
          </span>
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !settings.site_name.trim() || !settings.site_description.trim()}
          className="min-w-[120px]"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}