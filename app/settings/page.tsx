"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Download,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Loader2,
  Send,
  Lock,
  Mail,
  Check,
  Monitor,
  MapPin,
  Clock
} from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import { useTranslations } from "@/components/general/I18nProvider";
import { PushNotificationSettings } from "@/components/settings/PushNotificationSettings";

interface UserSettings {
  name: string;
  email: string;
  notifications: {
    email: boolean;
    push: boolean;
    courseUpdates: boolean;
    announcements: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showProgress: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    autoPlay: boolean;
    downloadQuality: 'low' | 'medium' | 'high';
  };
}

export default function SettingsPage() {
  const { session, refreshSession } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  
  // Determine active tab from pathname
  const getActiveTab = () => {
    if (pathname.includes('/profile')) return 'profile';
    if (pathname.includes('/security')) return 'security';
    if (pathname.includes('/notifications')) return 'notifications';
    return 'profile'; // default
  };
  
  const [activeTab, setActiveTab] = useState<string>(getActiveTab());
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  
  // Redirect to /settings/profile if on base /settings
  useEffect(() => {
    if (pathname === '/settings') {
      router.replace('/settings/profile');
    }
  }, [pathname, router]);
  
  const [settings, setSettings] = useState<UserSettings>({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    notifications: {
      email: true,
      push: true,
      courseUpdates: true,
      announcements: true,
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showProgress: true,
    },
    preferences: {
      theme: 'system',
      autoPlay: true,
      downloadQuality: 'high',
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSendingTestNotification, setIsSendingTestNotification] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (session?.user) {
        setIsLoadingSettings(true);
        try {
          const [profileRes, settingsRes] = await Promise.all([
            fetch('/api/user/profile'),
            fetch('/api/user/settings')
          ]);
          
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setSettings(prev => ({
              ...prev,
              name: profileData.user.name || '',
              email: profileData.user.email || '',
            }));
          }

          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            if (settingsData.settings) {
              setSettings(prev => ({
                ...prev,
                notifications: settingsData.settings.notifications || prev.notifications,
                privacy: settingsData.settings.privacy || prev.privacy,
                preferences: settingsData.settings.preferences || prev.preferences,
              }));
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          toast.error(t("settings.failedToLoadSettings"));
        } finally {
          setIsLoadingSettings(false);
        }
      }
    };

    loadUserData();
  }, [session]);

  // Load devices when on security tab
  useEffect(() => {
    if (activeTab === 'security' && session?.user) {
      loadDevices();
    }
  }, [activeTab, session]);

  const loadDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const response = await fetch('/api/user/devices');
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const removeDevice = async (deviceId: string) => {
    setRemovingDeviceId(deviceId);
    try {
      const response = await fetch('/api/user/devices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });

      if (response.ok) {
        toast.success('Device removed successfully');
        loadDevices(); // Reload devices
      } else {
        toast.error('Failed to remove device');
      }
    } catch (error) {
      console.error('Failed to remove device:', error);
      toast.error('Failed to remove device');
    } finally {
      setRemovingDeviceId(null);
    }
  };

  // Handle pathname changes for navigation
  useEffect(() => {
    const tab = getActiveTab();
    setActiveTab(tab);
  }, [pathname]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const [profileResponse, settingsResponse] = await Promise.all([
        fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: settings.name, email: settings.email }),
        }),
        fetch('/api/user/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notifications: settings.notifications,
            privacy: settings.privacy,
            preferences: settings.preferences,
          }),
        })
      ]);

      if (!profileResponse.ok || !settingsResponse.ok) {
        throw new Error('Failed to update settings');
      }

      await refreshSession();
      toast.success(t("settings.settingsUpdatedSuccess"));
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(error instanceof Error ? error.message : t("settings.failedToUpdateSettings"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const exportData = {
        profile: { name: settings.name, email: settings.email },
        settings: {
          notifications: settings.notifications,
          privacy: settings.privacy,
          preferences: settings.preferences,
        },
        exportedAt: new Date().toISOString(),
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t("settings.dataExportedSuccess"));
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error(t("settings.failedToExportData"));
    }
  };

  // Delete account functionality disabled to prevent database deletion
  // const handleDeleteAccount = async () => {
  //   const confirmed = confirm(t("settings.confirmDeleteAccount"));
  //   
  //   if (confirmed) {
  //     try {
  //       const response = await fetch('/api/user/delete-account', {
  //         method: 'DELETE',
  //         headers: { 'Content-Type': 'application/json' },
  //       });

  //       if (response.ok) {
  //         toast.success(t("settings.accountDeletionInitiated"));
  //         setTimeout(() => { window.location.href = '/'; }, 2000);
  //       } else {
  //         throw new Error('Failed to delete account');
  //       }
  //     } catch (error) {
  //       console.error('Error deleting account:', error);
  //       toast.error(t("settings.accountDeletionNotAvailable"));
  //     }
  //   }
  // };

  const sendTestNotification = async () => {
    setIsSendingTestNotification(true);
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: "Test Notification",
          message: "This is a test notification. If you see this, notifications are working!",
          type: "info"
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.pushSent) {
          toast.success("🔔 Test push notification sent! Check your browser notifications.");
        } else {
          toast.success(t("settings.testNotificationSent"));
        }
      } else {
        throw new Error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error(t("settings.failedToSendTestNotification"));
    } finally {
      setIsSendingTestNotification(false);
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Header - Admin Style */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight !text-center">{t("settings.settings")}</h1>
        <p className="text-muted-foreground !text-center">{t("settings.manageYourSettings")}</p>
      </div>

      {/* Profile Section */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card className="@container/card" dir="auto">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <User className="h-4 w-4 md:h-5 md:w-5" />
                {t("settings.profileSettings")}
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                {t("settings.updateProfileInfo")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">{t("settings.fullName")}</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t("settings.enterFullName")}
                  className="h-11 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">{t("settings.emailAddress")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={t("settings.enterEmail")}
                  className="h-11 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("settings.changePassword")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("settings.enterNewPassword")}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Section */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {!(session?.user as any)?.emailVerified && (
            <Card className="@container/card">
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {t("settings.emailVerification")}
                </CardTitle>
                <CardDescription>
                  {t("settings.verifyEmailToSecure")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                  <p className="text-sm mb-4">
                    {t("settings.verifyEmailAddress")} <span className="font-medium">{settings.email}</span> {t("settings.toSecureAccount")}
                  </p>
                  
                  {!verificationEmailSent ? (
                    <Button 
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/auth/verify-email', { method: 'POST' });
                          const data = await response.json();
                          if (response.ok) {
                            toast.success(t("settings.verificationEmailSent"));
                            setVerificationEmailSent(true);
                          } else {
                            toast.error(data.error || t("settings.failedToSendVerification"));
                          }
                        } catch (error) {
                          toast.error(t("settings.failedToSendVerification"));
                        }
                      }}
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {t("settings.sendVerificationEmail")}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="verification-code">{t("settings.enterVerificationCode")}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/auth/verify-email', { method: 'POST' });
                              const data = await response.json();
                              if (response.ok) {
                                toast.success(t("settings.newVerificationEmailSent"));
                              } else {
                                toast.error(data.error || t("settings.failedToSendVerification"));
                              }
                            } catch (error) {
                              toast.error(t("settings.failedToSendVerification"));
                            }
                          }}
                        >
                          {t("settings.resendCode")}
                        </Button>
                      </div>
                      <Input
                        id="verification-code"
                        placeholder={t("settings.enterSixDigitCode")}
                        maxLength={6}
                        className="text-center text-lg tracking-widest font-mono"
                      />
                      <Button 
                        onClick={async () => {
                          const codeInput = document.getElementById('verification-code') as HTMLInputElement;
                          const code = codeInput?.value;
                          
                          if (!code || code.length !== 6) {
                            toast.error(t("settings.pleaseEnterValidCode"));
                            return;
                          }
                          
                          try {
                            const response = await fetch('/api/auth/verify-email', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ otp: code })
                            });
                            const data = await response.json();
                            
                            if (response.ok) {
                              toast.success(t("settings.emailVerifiedSuccess"));
                              window.location.reload();
                            } else {
                              toast.error(data.error || t("settings.invalidVerificationCode"));
                            }
                          } catch (error) {
                            toast.error(t("settings.failedToVerifyEmail"));
                          }
                        }}
                        className="w-full"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {t("settings.verifyEmail")}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="@container/card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t("settings.activeSessions")}
              </CardTitle>
              <CardDescription>
                {t("settings.manageLoggedInDevices")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDevices ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : devices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No devices found
                </p>
              ) : (
                <div className="space-y-4">
                  {devices.map((device, index) => {
                    const currentDevice = index === 0; // First device is current one
                    const lastSeen = new Date(device.lastSeen);
                    const isRecent = Date.now() - lastSeen.getTime() < 10 * 60 * 1000; // Within 10 minutes
                    
                    return (
                      <div key={device.id} className="flex items-start justify-between py-3 border-b last:border-0">
                        <div className="flex gap-3 flex-1">
                          <div className="mt-1">
                            <Monitor className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{device.deviceName || 'Unknown Device'}</p>
                              {isRecent && <Badge variant="secondary" className="text-xs">Active Now</Badge>}
                            </div>
                            <div className="space-y-0.5 text-sm text-muted-foreground">
                              {(device.city !== 'Unknown' || device.country !== 'Unknown') && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span className="truncate">
                                    {[device.city, device.region, device.country]
                                      .filter(v => v && v !== 'Unknown')
                                      .join(', ') || 'Unknown Location'}
                                  </span>
                                </div>
                              )}
                              {device.isp && device.isp !== 'Unknown' && (
                                <div className="flex items-center gap-1.5">
                                  <Globe className="h-3.5 w-3.5" />
                                  <span className="truncate">{device.isp}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Last seen: {lastSeen.toLocaleDateString()} {lastSeen.toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDevice(device.deviceId)}
                          disabled={removingDeviceId === device.deviceId}
                          className="ml-2"
                        >
                          {removingDeviceId === device.deviceId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Section */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Push Notifications Card */}
          <PushNotificationSettings />
          
          <Card className="@container/card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t("settings.notificationPreferences")}
              </CardTitle>
              <CardDescription>
                {t("settings.chooseNotifications")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5">
                  <Label>{t("settings.emailNotifications")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.receiveEmailNotifications")}
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, email: checked }
                  }))}
                />
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5">
                  <Label>{t("settings.pushNotifications")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.receivePushNotifications")}
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, push: checked }
                  }))}
                />
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5">
                  <Label>{t("settings.courseUpdates")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.getNotifiedCourses")}
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.courseUpdates}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, courseUpdates: checked }
                  }))}
                />
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5">
                  <Label>{t("settings.announcements")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.receiveAnnouncements")}
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.announcements}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, announcements: checked }
                  }))}
                />
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5 flex-1">
                  <Label>{t("settings.testNotifications")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.sendTestNotification")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sendTestNotification}
                  disabled={isSendingTestNotification}
                  className="min-w-[100px] w-full sm:w-auto"
                >
                  {isSendingTestNotification ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("settings.sending")}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {t("settings.test")}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Privacy Section */}
      {/* Privacy Section - Removed as requested */}
      {/* {activeTab === 'privacy' && (
        <div className="space-y-6">
          <Card className="@container/card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t("settings.privacySettings")}
              </CardTitle>
              <CardDescription>
                {t("settings.controlPrivacy")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{t("settings.profileVisibility")}</Label>
                <Select 
                  value={settings.privacy.profileVisibility} 
                  onValueChange={(value: 'public' | 'private' | 'friends') => setSettings(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, profileVisibility: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">{t("settings.public")}</SelectItem>
                    <SelectItem value="friends">{t("settings.friendsOnly")}</SelectItem>
                    <SelectItem value="private">{t("settings.private")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.showEmailAddress")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.allowShowEmail")}
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.showEmail}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, showEmail: checked }
                  }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.showLearningProgress")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.displayProgress")}
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.showProgress}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, showProgress: checked }
                  }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )} */}

      {/* Preferences Section - Removed as requested */}
      {/* {activeTab === 'preferences' && (
        <div className="space-y-6">
          <Card className="@container/card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                {t("settings.appPreferences")}
              </CardTitle>
              <CardDescription>
                {t("settings.customizeExperience")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.autoPlayVideos")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.automaticallyPlay")}
                  </p>
                </div>
                <Switch
                  checked={settings.preferences.autoPlay}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, autoPlay: checked }
                  }))}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>{t("settings.downloadQuality")}</Label>
                <Select 
                  value={settings.preferences.downloadQuality} 
                  onValueChange={(value: 'low' | 'medium' | 'high') => setSettings(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, downloadQuality: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t("settings.low")} (480p)</SelectItem>
                    <SelectItem value="medium">{t("settings.medium")} (720p)</SelectItem>
                    <SelectItem value="high">{t("settings.high")} (1080p)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="@container/card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t("settings.dataManagement")}
              </CardTitle>
              <CardDescription>
                {t("settings.exportDataManage")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button onClick={handleExportData} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {t("settings.exportData")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )} */}

      {/* Save Button - Sticky at bottom */}
      <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t pt-4 -mx-4 px-4 lg:-mx-6 lg:px-6 z-10">
        <Button 
          onClick={handleSave} 
          disabled={isLoading} 
          className="w-full md:w-auto flex items-center justify-center gap-2 h-12 md:h-11 text-base font-medium shadow-lg hover:shadow-xl transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("settings.saving")}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {t("settings.saveChanges")}
            </>
          )}
        </Button>
      </div>
    </>
  );
}
