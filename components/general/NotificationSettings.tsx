"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { toast } from 'sonner';

interface NotificationSettingsProps {
  className?: string;
  translations?: {
    browserNotifications: string;
    browserNotSupported: string;
    instantNotifications: string;
    permissionStatus: string;
    currentPermission: string;
    granted: string;
    denied: string;
    notRequested: string;
    enableNotifications: string;
    receivePushNotifications: string;
    requestPermission: string;
    notificationsBlocked: string;
    clickToEnable: string;
    enableBrowserNotifications: string;
    notificationTypes: string;
    tutorResponses: string;
    newLessons: string;
    courseAnnouncements: string;
    liveLessonReminders: string;
  };
}

export function NotificationSettings({ className, translations }: NotificationSettingsProps) {
  const {
    isSupported,
    permission,
    isEnabled,
    requestPermission,
    enableNotifications,
    disableNotifications,
  } = useNotifications();

  const [browserNotifications, setBrowserNotifications] = useState(false);

  useEffect(() => {
    setBrowserNotifications(isEnabled);
  }, [isEnabled]);

  const handleBrowserNotificationToggle = async (checked: boolean) => {
    if (checked) {
      await enableNotifications();
    } else {
      disableNotifications();
    }
    setBrowserNotifications(checked);
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <Check className="h-3 w-3" />
            {translations?.granted || "Granted"}
          </Badge>
        );
      case 'denied':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <X className="h-3 w-3" />
            {translations?.denied || "Denied"}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {translations?.notRequested || "Not Requested"}
          </Badge>
        );
    }
  };

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            {translations?.browserNotifications || "Browser Notifications"}
          </CardTitle>
          <CardDescription>
            {translations?.browserNotSupported || "Browser notifications are not supported on this device"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {translations?.browserNotifications || "Browser Notifications"}
        </CardTitle>
        <CardDescription>
          {translations?.instantNotifications || "Get instant notifications about course updates and tutor responses"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">{translations?.permissionStatus || "Permission Status"}</Label>
            <p className="text-sm text-muted-foreground">
              {translations?.currentPermission || "Current browser notification permission"}
            </p>
          </div>
          {getPermissionBadge()}
        </div>

        <Separator />

        {/* Enable/Disable Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">{translations?.enableNotifications || "Enable Notifications"}</Label>
            <p className="text-sm text-muted-foreground">
              {translations?.receivePushNotifications || "Receive push notifications in your browser"}
            </p>
          </div>
          <Switch
            checked={browserNotifications && permission === 'granted'}
            onCheckedChange={handleBrowserNotificationToggle}
            disabled={permission === 'denied'}
          />
        </div>

        {/* Request Permission Button */}
        {permission !== 'granted' && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base">{translations?.requestPermission || "Request Permission"}</Label>
                <p className="text-sm text-muted-foreground">
                  {permission === 'denied' 
                    ? translations?.notificationsBlocked || "Notifications are blocked. Please enable them in your browser settings."
                    : translations?.clickToEnable || "Click below to enable browser notifications for this site."
                  }
                </p>
              </div>
              {permission !== 'denied' && (
                <Button onClick={requestPermission} className="w-full">
                  <Bell className="h-4 w-4 mr-2" />
                  {translations?.enableBrowserNotifications || "Enable Browser Notifications"}
                </Button>
              )}
            </div>
          </>
        )}

        {/* Notification Types */}
        {permission === 'granted' && (
          <>
            <Separator />
            <div className="space-y-4">
              <Label className="text-base">{translations?.notificationTypes || "Notification Types"}</Label>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>{translations?.tutorResponses || "Tutor responses to your assignments"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary-foreground rounded-full" />
                  <span>{translations?.newLessons || "New lessons in enrolled courses"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent-foreground rounded-full" />
                  <span>{translations?.courseAnnouncements || "Course updates and announcements"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-destructive rounded-full" />
                  <span>{translations?.liveLessonReminders || "Live lesson reminders"}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}