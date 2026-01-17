"use client";

import { useState, useEffect, useCallback } from 'react';
import { notificationService, NotificationPayload } from '@/lib/notification-service';
import { toast } from 'sonner';
import { useTranslations } from '@/components/general/I18nProvider';

interface UseNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isEnabled: boolean;
  isPushEnabled: boolean;
  requestPermission: () => Promise<boolean>;
  showNotification: (payload: NotificationPayload) => Promise<void>;
  enableNotifications: () => Promise<void>;
  disableNotifications: () => void;
  enablePushNotifications: () => Promise<boolean>;
  disablePushNotifications: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const t = useTranslations();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported(notificationService.isNotificationSupported());
    setPermission(notificationService.getPermission());

    // Check if user has enabled notifications in settings
    const savedPreference = localStorage.getItem('notifications-enabled');
    setIsEnabled(savedPreference === 'true' && notificationService.getPermission() === 'granted');
    
    // Check if push notifications are enabled
    const pushPreference = localStorage.getItem('push-notifications-enabled');
    setIsPushEnabled(pushPreference === 'true');
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const newPermission = await notificationService.requestPermission();
      setPermission(newPermission);
      
      if (newPermission === 'granted') {
        localStorage.setItem('notifications-enabled', 'true');
        setIsEnabled(true);
        toast.success(t("toasts.notifications.enabledSuccessfully"));
        return true;
      } else if (newPermission === 'denied') {
        toast.error(t("toasts.notifications.permissionDenied"));
        return false;
      } else {
        toast.info(t("toasts.notifications.permissionNotGranted"));
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error(t("toasts.notifications.failedToRequestPermission"));
      return false;
    }
  }, [t]);

  const showNotification = useCallback(async (payload: NotificationPayload): Promise<void> => {
    if (!isEnabled) {
      return;
    }

    try {
      await notificationService.showNotification(payload);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [isEnabled]);

  const enableNotifications = useCallback(async (): Promise<void> => {
    if (permission === 'granted') {
      localStorage.setItem('notifications-enabled', 'true');
      setIsEnabled(true);
      toast.success(t("toasts.notifications.enabled"));
    } else {
      await requestPermission();
    }
  }, [permission, requestPermission, t]);

  const disableNotifications = useCallback((): void => {
    localStorage.setItem('notifications-enabled', 'false');
    setIsEnabled(false);
    toast.info(t("toasts.notifications.disabled"));
  }, [t]);

  const enablePushNotifications = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[useNotifications] Enabling push notifications...');
      
      // First ensure basic notifications are enabled
      if (permission !== 'granted') {
        console.log('[useNotifications] Requesting notification permission...');
        const granted = await requestPermission();
        if (!granted) {
          console.log('[useNotifications] Permission not granted');
          return false;
        }
      }

      console.log('[useNotifications] Subscribing to push...');
      // Subscribe to push notifications
      const subscription = await notificationService.subscribeToPush();
      
      if (subscription) {
        console.log('[useNotifications] Push subscription successful!');
        localStorage.setItem('push-notifications-enabled', 'true');
        setIsPushEnabled(true);
        toast.success(t("toasts.notifications.pushEnabled"));
        return true;
      }
      
      console.log('[useNotifications] Push subscription returned null');
      toast.error('Failed to create push subscription');
      return false;
    } catch (error) {
      console.error('[useNotifications] Error enabling push notifications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Show user-friendly error message
      if (errorMessage.includes('not supported')) {
        toast.error('Push notifications are not supported in your browser');
      } else if (errorMessage.includes('permission')) {
        toast.error('Notification permission is required');
      } else if (errorMessage.includes('VAPID')) {
        toast.error('Server configuration issue. Please contact support.');
      } else if (errorMessage.includes('Registration failed')) {
        toast.error('Failed to register for push notifications. Please try again or use a different browser.');
      } else {
        toast.error(t("toasts.notifications.failedToEnablePush") + ': ' + errorMessage);
      }
      
      return false;
    }
  }, [permission, requestPermission, t]);

  const disablePushNotifications = useCallback(async (): Promise<void> => {
    try {
      await notificationService.unsubscribeFromPush();
      localStorage.setItem('push-notifications-enabled', 'false');
      setIsPushEnabled(false);
      toast.info(t("toasts.notifications.pushDisabled"));
    } catch (error) {
      console.error('Error disabling push notifications:', error);
      toast.error(t("toasts.notifications.failedToDisablePush"));
    }
  }, [t]);

  return {
    isSupported,
    permission,
    isEnabled,
    isPushEnabled,
    requestPermission,
    showNotification,
    enableNotifications,
    disableNotifications,
    enablePushNotifications,
    disablePushNotifications,
  };
}