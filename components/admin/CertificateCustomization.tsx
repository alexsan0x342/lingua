"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Palette, Eye, Save, RotateCcw, Type, Layout, Image, Settings } from "lucide-react";
import { toast } from "sonner";

interface CertificateSettings {
  id: string;
  // Colors
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  headerTextColor: string;
  borderColor: string;
  backgroundGradient: string;
  
  // Typography
  titleFont: string;
  bodyFont: string;
  titleFontSize: string;
  bodyFontSize: string;
  
  // Layout
  layout: string;
  orientation: string;
  logoPosition: string;
  signaturePosition: string;
  
  // Branding
  logoUrl?: string;
  logoWidth: string;
  logoHeight: string;
  institutionName: string;
  institutionTitle: string;
  
  // Border and decorations
  borderStyle: string;
  borderWidth: string;
  showDecorations: boolean;
  decorationStyle: string;
  
  // Footer
  footerText: string;
  showQRCode: boolean;
  showCertificateId: boolean;
}

const fontOptions = [
  { value: 'serif', label: 'Serif (Classic)' },
  { value: 'sans-serif', label: 'Sans-serif (Modern)' },
  { value: 'monospace', label: 'Monospace (Technical)' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
];

const layoutOptions = [
  { value: 'classic', label: 'Classic', description: 'Traditional academic style' },
  { value: 'modern', label: 'Modern', description: 'Clean contemporary design' },
  { value: 'elegant', label: 'Elegant', description: 'Sophisticated and refined' },
  { value: 'minimal', label: 'Minimal', description: 'Simple and clean' },
];

const decorationOptions = [
  { value: 'classic', label: 'Classic', description: 'Traditional ornamental' },
  { value: 'modern', label: 'Modern', description: 'Contemporary accents' },
  { value: 'minimal', label: 'Minimal', description: 'Subtle elements' },
  { value: 'ornate', label: 'Ornate', description: 'Rich decorative' },
];

export function CertificateCustomization() {
  const [settings, setSettings] = useState<CertificateSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/certificate-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        toast.error('Failed to load certificate settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load certificate settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/certificate-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Certificate settings saved successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all certificate settings to defaults? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/certificate-settings', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Certificate settings reset to defaults');
        fetchSettings();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to reset settings');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Failed to reset settings');
    }
  };

  const updateSetting = (key: string, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const handlePreview = () => {
    // Open certificate preview in new tab
    window.open('/api/certificates/generate?preview=true', '_blank');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-10 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Failed to load certificate settings</p>
          <Button onClick={fetchSettings} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Certificate Customization</h1>
          <p className="text-muted-foreground">
            Customize the appearance and branding of your course certificates
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="options" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Options
          </TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <CardDescription>
                Customize the colors used throughout your certificates
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => updateSetting('primaryColor', e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => updateSetting('primaryColor', e.target.value)}
                    placeholder="#1e40af"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={settings.secondaryColor}
                    onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                    placeholder="#059669"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textColor">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={settings.textColor}
                    onChange={(e) => updateSetting('textColor', e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={settings.textColor}
                    onChange={(e) => updateSetting('textColor', e.target.value)}
                    placeholder="#1f2937"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headerTextColor">Header Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="headerTextColor"
                    type="color"
                    value={settings.headerTextColor}
                    onChange={(e) => updateSetting('headerTextColor', e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={settings.headerTextColor}
                    onChange={(e) => updateSetting('headerTextColor', e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="borderColor">Border Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="borderColor"
                    type="color"
                    value={settings.borderColor}
                    onChange={(e) => updateSetting('borderColor', e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={settings.borderColor}
                    onChange={(e) => updateSetting('borderColor', e.target.value)}
                    placeholder="#d1d5db"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="backgroundGradient">Background Gradient</Label>
                <Input
                  id="backgroundGradient"
                  value={settings.backgroundGradient}
                  onChange={(e) => updateSetting('backgroundGradient', e.target.value)}
                  placeholder="linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)"
                />
                <p className="text-sm text-muted-foreground">
                  CSS gradient syntax (e.g., linear-gradient(135deg, #color1 0%, #color2 100%))
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Typography Settings</CardTitle>
              <CardDescription>
                Configure fonts and text sizing for your certificates
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="titleFont">Title Font</Label>
                <Select value={settings.titleFont} onValueChange={(value) => updateSetting('titleFont', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodyFont">Body Font</Label>
                <Select value={settings.bodyFont} onValueChange={(value) => updateSetting('bodyFont', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="titleFontSize">Title Font Size</Label>
                <Input
                  id="titleFontSize"
                  value={settings.titleFontSize}
                  onChange={(e) => updateSetting('titleFontSize', e.target.value)}
                  placeholder="28px"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodyFontSize">Body Font Size</Label>
                <Input
                  id="bodyFontSize"
                  value={settings.bodyFontSize}
                  onChange={(e) => updateSetting('bodyFontSize', e.target.value)}
                  placeholder="14px"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Layout & Style</CardTitle>
              <CardDescription>
                Choose the overall layout and decorative elements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Certificate Layout</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {layoutOptions.map((layout) => (
                      <div
                        key={layout.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          settings.layout === layout.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => updateSetting('layout', layout.value)}
                      >
                        <div className="font-medium">{layout.label}</div>
                        <div className="text-xs text-muted-foreground">{layout.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Decoration Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {decorationOptions.map((decoration) => (
                      <div
                        key={decoration.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          settings.decorationStyle === decoration.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => updateSetting('decorationStyle', decoration.value)}
                      >
                        <div className="font-medium">{decoration.label}</div>
                        <div className="text-xs text-muted-foreground">{decoration.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="orientation">Orientation</Label>
                  <Select value={settings.orientation} onValueChange={(value) => updateSetting('orientation', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landscape">Landscape</SelectItem>
                      <SelectItem value="portrait">Portrait</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoPosition">Logo Position</Label>
                  <Select value={settings.logoPosition} onValueChange={(value) => updateSetting('logoPosition', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="top-center">Top Center</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signaturePosition">Signature Position</Label>
                  <Select value={settings.signaturePosition} onValueChange={(value) => updateSetting('signaturePosition', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="bottom-center">Bottom Center</SelectItem>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Border Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="borderStyle">Border Style</Label>
                    <Select value={settings.borderStyle} onValueChange={(value) => updateSetting('borderStyle', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="dashed">Dashed</SelectItem>
                        <SelectItem value="dotted">Dotted</SelectItem>
                        <SelectItem value="decorative">Decorative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="borderWidth">Border Width</Label>
                    <Input
                      id="borderWidth"
                      value={settings.borderWidth}
                      onChange={(e) => updateSetting('borderWidth', e.target.value)}
                      placeholder="2px"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-7">
                    <Switch
                      id="showDecorations"
                      checked={settings.showDecorations}
                      onCheckedChange={(checked) => updateSetting('showDecorations', checked)}
                    />
                    <Label htmlFor="showDecorations">Show Decorations</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Institution Branding</CardTitle>
              <CardDescription>
                Configure your institution's branding and identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="institutionName">Institution Name</Label>
                  <Input
                    id="institutionName"
                    value={settings.institutionName}
                    onChange={(e) => updateSetting('institutionName', e.target.value)}
                    placeholder="Learning Management System"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institutionTitle">Certificate Title</Label>
                  <Input
                    id="institutionTitle"
                    value={settings.institutionTitle}
                    onChange={(e) => updateSetting('institutionTitle', e.target.value)}
                    placeholder="Certificate of Completion"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                  <Input
                    id="logoUrl"
                    value={settings.logoUrl || ''}
                    onChange={(e) => updateSetting('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave empty to use default institution initials
                  </p>
                </div>

                <div className="space-y-4">
                  <Label>Logo Dimensions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="logoWidth" className="text-sm">Width</Label>
                      <Input
                        id="logoWidth"
                        value={settings.logoWidth}
                        onChange={(e) => updateSetting('logoWidth', e.target.value)}
                        placeholder="120px"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="logoHeight" className="text-sm">Height</Label>
                      <Input
                        id="logoHeight"
                        value={settings.logoHeight}
                        onChange={(e) => updateSetting('logoHeight', e.target.value)}
                        placeholder="auto"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Options Tab */}
        <TabsContent value="options" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Certificate Options</CardTitle>
              <CardDescription>
                Configure additional certificate features and footer content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="footerText">Footer Text</Label>
                <Input
                  id="footerText"
                  value={settings.footerText}
                  onChange={(e) => updateSetting('footerText', e.target.value)}
                  placeholder="This certificate validates the successful completion of the course requirements."
                />
                <p className="text-sm text-muted-foreground">
                  Text displayed at the bottom of the certificate
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Display Options</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="showQRCode">Show QR Code</Label>
                      <p className="text-sm text-muted-foreground">
                        Display a QR code for certificate verification
                      </p>
                    </div>
                    <Switch
                      id="showQRCode"
                      checked={settings.showQRCode}
                      onCheckedChange={(checked) => updateSetting('showQRCode', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="showCertificateId">Show Certificate ID</Label>
                      <p className="text-sm text-muted-foreground">
                        Display the unique certificate identifier
                      </p>
                    </div>
                    <Switch
                      id="showCertificateId"
                      checked={settings.showCertificateId}
                      onCheckedChange={(checked) => updateSetting('showCertificateId', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">Preview Settings</Badge>
                  <p className="text-sm text-muted-foreground">
                    Current layout: <span className="font-medium">{settings.layout}</span> • 
                    Orientation: <span className="font-medium">{settings.orientation}</span> • 
                    Decorations: <span className="font-medium">{settings.showDecorations ? 'Enabled' : 'Disabled'}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}