"use client";

import React, { useEffect } from "react";
import { useDeviceTracking } from "@/hooks/use-device-tracking";
import { useSingleSession } from "@/hooks/use-single-session";
import { notificationService } from "@/lib/notification-service";

export function StartupTasks() {
  // Track device with IP geolocation
  useDeviceTracking();
  
  // Enforce single session per user
  useSingleSession();

  useEffect(() => {
    // Request notification permission on first login
    const requestNotificationPermission = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        // Check if permission was already requested
        const hasAskedBefore = localStorage.getItem('notificationPermissionAsked');
        
        if (!hasAskedBefore && Notification.permission === 'default') {
          // Wait a bit so user isn't immediately bombarded
          setTimeout(async () => {
            try {
              const permission = await notificationService.requestPermission();
              localStorage.setItem('notificationPermissionAsked', 'true');
              
              if (permission === 'granted') {
                // Try to subscribe to push notifications
                try {
                  await notificationService.subscribeToPush();
                  console.log('[StartupTasks] Push notifications enabled successfully');
                } catch (pushError) {
                  console.log('[StartupTasks] Push subscription failed, user can enable later in settings:', pushError);
                }
              }
            } catch (error) {
              console.log('[StartupTasks] Notification permission request failed:', error);
            }
          }, 3000); // Wait 3 seconds after login
        } else if (Notification.permission === 'granted') {
          // If permission already granted, ensure they're subscribed
          try {
            await notificationService.subscribeToPush();
          } catch (error) {
            console.log('[StartupTasks] Already subscribed or subscription failed:', error);
          }
        }
      }
    };

    requestNotificationPermission();

    // Run migrations via API call to avoid server-only import issues
    const runTasks = async () => {
      try {
        console.log("🚀 Running startup tasks...");
        const response = await fetch('/api/startup-tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log("✅ Startup tasks completed:", result.message);
        } else {
          console.error("❌ Startup tasks failed:", response.statusText);
        }
      } catch (error) {
        console.error("❌ Failed to run startup tasks:", error);
      }
    };

    // Run tasks after a short delay to ensure the app is fully loaded
    const timeoutId = setTimeout(runTasks, 2000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return null;
}
