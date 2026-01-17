"use client";

import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Smartphone, Loader2 } from 'lucide-react';
import { useTranslations } from '@/components/general/I18nProvider';

export function PushNotificationSettings() {
  const t = useTranslations();
  const {
    isSupported,
    permission,
    isEnabled,
    isPushEnabled,
    enableNotifications,
    disableNotifications,
    enablePushNotifications,
    disablePushNotifications,
  } = useNotifications();

  const [isLoading, setIsLoading] = useState(false);

  const handleNotificationToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      if (checked) {
        await enableNotifications();
      } else {
        disableNotifications();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      if (checked) {
        await enablePushNotifications();
      } else {
        await disablePushNotifications();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            {t("settings.notifications")}
          </CardTitle>
          <CardDescription>
            {t("settings.notificationsNotSupported")}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t("settings.notifications")}
        </CardTitle>
        <CardDescription>
          {t("settings.manageNotificationSettings")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Browser Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-medium">{t("settings.browserNotifications")}</div>
            <div className="text-sm text-muted-foreground">
              {t("settings.browserNotificationsDescription")}
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleNotificationToggle}
            disabled={isLoading || permission === 'denied'}
          />
        </div>

        {/* Permission Denied Warning */}
        {permission === 'denied' && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-medium">{t("settings.notificationPermissionDenied")}</p>
            <p className="mt-1 text-xs">
              {t("settings.enableInBrowserSettings")}
            </p>
          </div>
        )}

        {/* Push Notifications (Background) */}
        {isEnabled && permission === 'granted' && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-medium">
                  <Smartphone className="h-4 w-4" />
                  {t("settings.pushNotifications")}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("settings.pushNotificationsDescription")}
                </div>
              </div>
              <Switch
                checked={isPushEnabled}
                onCheckedChange={handlePushToggle}
                disabled={isLoading}
              />
            </div>

            {isPushEnabled && (
              <div className="rounded-lg bg-primary/10 p-4 text-sm">
                <p className="font-medium text-primary">✓ {t("settings.pushNotificationsActive")}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("settings.pushNotificationsActiveDescription")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("common.loading")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
