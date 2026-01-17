/**
 * Client-side notification service for browser push notifications
 */

import { registerServiceWorker } from './service-worker';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class NotificationService {
  private static instance: NotificationService;
  private isSupported = false;
  private permission: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.isSupported = true;
      this.permission = Notification.permission;
      
      // Register service worker for background notifications
      this.initServiceWorker();
    }
  }

  /**
   * Initialize service worker for push notifications
   */
  private async initServiceWorker(): Promise<void> {
    try {
      const registration = await registerServiceWorker();
      if (registration) {
        console.log('[NotificationService] Service worker registered successfully');
      } else {
        console.warn('[NotificationService] Service worker registration returned null');
      }
    } catch (error) {
      console.error('[NotificationService] Failed to register service worker:', error);
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    console.log('[NotificationService] Starting push subscription...');
    
    if (!this.isSupported) {
      console.error('[NotificationService] Browser notifications not supported');
      throw new Error('Browser notifications are not supported');
    }

    if (this.permission !== 'granted') {
      console.error('[NotificationService] Notification permission not granted:', this.permission);
      throw new Error('Notification permission not granted');
    }

    try {
      // Ensure service worker is registered first
      console.log('[NotificationService] Registering service worker...');
      await registerServiceWorker();
      
      // Wait for service worker to be ready
      console.log('[NotificationService] Waiting for service worker to be ready...');
      const registration = await navigator.serviceWorker.ready;
      console.log('[NotificationService] Service worker ready:', registration.active?.state);
      
      // Small delay to ensure service worker is fully active
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check for existing subscription. If present, reuse it instead of unsubscribing
      let existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('[NotificationService] Found existing subscription - reusing it');
        try {
          await this.sendSubscriptionToServer(existingSubscription);
          console.log('[NotificationService] Existing subscription sent to server');
          return existingSubscription;
        } catch (sendError) {
          console.warn('[NotificationService] Failed to send existing subscription to server, will attempt to create a fresh one:', sendError);
          // fall through to attempt a fresh subscription
        }
      }
      
      // Get VAPID public key from server
      console.log('[NotificationService] Fetching VAPID public key...');
      let vapidPublicKey: string | undefined;
      
      try {
        const response = await fetch('/api/push/vapid-key');
        if (response.ok) {
          const data = await response.json();
          vapidPublicKey = data.publicKey;
          console.log('[NotificationService] VAPID key received:', vapidPublicKey?.substring(0, 20) + '...');
        } else {
          const errorText = await response.text();
          console.error('[NotificationService] Failed to fetch VAPID key, status:', response.status, 'body:', errorText);
          throw new Error(`Failed to fetch VAPID key: ${response.status}`);
        }
      } catch (fetchError) {
        console.error('[NotificationService] Error fetching VAPID key:', fetchError);
        throw new Error('Failed to fetch VAPID key from server');
      }
      
      if (!vapidPublicKey) {
        console.error('[NotificationService] VAPID public key not available');
        throw new Error('VAPID public key not configured on server');
      }

      // Create new subscription
      console.log('[NotificationService] Creating new push subscription...');
      let subscription: PushSubscription;
      try {
        const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);
        console.log('[NotificationService] VAPID key converted to Uint8Array, length:', applicationServerKey.length);

        // Try subscription, with one retry for transient push-service errors
        const attemptSubscribe = async () => {
          return await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey,
          });
        };

        try {
          subscription = await attemptSubscribe();
        } catch (firstErr) {
          // Silently retry once
          await new Promise((r) => setTimeout(r, 250));
          subscription = await attemptSubscribe();
        }

        console.log('[NotificationService] Push subscription created successfully!');
        console.log('[NotificationService] Subscription endpoint:', subscription.endpoint.substring(0, 50) + '...');
      } catch (subError) {
        // AbortError is common and transient - fail silently
        if (subError instanceof Error && subError.name === 'AbortError') {
          console.debug('[NotificationService] Push service temporarily unavailable');
          return null as unknown as PushSubscription;
        }
        console.debug('[NotificationService] Push subscription failed:', subError);
        return null as unknown as PushSubscription;
      }

      // Send subscription to server
      console.log('[NotificationService] Sending subscription to server...');
      try {
        await this.sendSubscriptionToServer(subscription);
        console.log('[NotificationService] Subscription saved successfully on server');
      } catch (serverError) {
        console.error('[NotificationService] Failed to save subscription on server:', serverError);
        // Unsubscribe since we couldn't save it
        await subscription.unsubscribe();
        throw new Error('Failed to save subscription on server');
      }
      
      return subscription;
    } catch (error) {
      console.error('[NotificationService] Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer();
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      throw error;
    }
  }

  /**
   * Remove subscription from server
   */
  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription');
      }
    } catch (error) {
      console.error('Error removing subscription from server:', error);
      throw error;
    }
  }

  /**
   * Convert base64 string to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Check if browser notifications are supported
   */
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get current notification permission status
   */
  getPermission(): NotificationPermission {
    return this.permission;
  }

  /**
   * Request permission for browser notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Browser notifications are not supported');
    }

    if (this.permission === 'granted') {
      return this.permission;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw new Error('Failed to request notification permission');
    }
  }

  /**
   * Show a browser notification
   */
  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isSupported) {
      console.warn('Browser notifications are not supported');
      return;
    }

    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/logo.svg',
        tag: payload.tag,
        data: payload.data,
        badge: '/logo.svg',
        requireInteraction: false,
        silent: false,
      });

      // Auto-close after 5 seconds if not clicked
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        // Handle custom actions based on notification data
        if (payload.data?.url) {
          window.location.href = payload.data.url;
        }
        
        notification.close();
      };

    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Show notification for tutor response
   */
  async showTutorResponseNotification(assignmentTitle: string, tutorName: string, submissionId: string): Promise<void> {
    await this.showNotification({
      title: '📚 Tutor Response Received',
      body: `${tutorName} has responded to your assignment "${assignmentTitle}"`,
      tag: `tutor-response-${submissionId}`,
      data: {
        type: 'tutor-response',
        submissionId,
        url: `/dashboard?tab=assignments`
      }
    });
  }

  /**
   * Show notification for new lesson
   */
  async showNewLessonNotification(lessonTitle: string, courseTitle: string, lessonId: string): Promise<void> {
    await this.showNotification({
      title: '🎯 New Lesson Available',
      body: `New lesson "${lessonTitle}" added to ${courseTitle}`,
      tag: `new-lesson-${lessonId}`,
      data: {
        type: 'new-lesson',
        lessonId,
        url: `/course/${courseTitle.toLowerCase().replace(/\s+/g, '-')}`
      }
    });
  }

  /**
   * Show notification for course update
   */
  async showCourseUpdateNotification(courseTitle: string, updateType: string, courseId: string): Promise<void> {
    await this.showNotification({
      title: '📖 Course Updated',
      body: `${courseTitle} has been updated: ${updateType}`,
      tag: `course-update-${courseId}`,
      data: {
        type: 'course-update',
        courseId,
        url: `/course/${courseTitle.toLowerCase().replace(/\s+/g, '-')}`
      }
    });
  }

  /**
   * Show notification for announcement
   */
  async showAnnouncementNotification(title: string, message: string, announcementId: string): Promise<void> {
    await this.showNotification({
      title: '📢 New Announcement',
      body: message,
      tag: `announcement-${announcementId}`,
      data: {
        type: 'announcement',
        announcementId,
        url: '/dashboard?tab=announcements'
      }
    });
  }

  /**
   * Show notification for live lesson reminder
   */
  async showLiveLessonReminderNotification(lessonTitle: string, scheduledTime: string, lessonId: string): Promise<void> {
    await this.showNotification({
      title: '🔴 Live Lesson Starting Soon',
      body: `"${lessonTitle}" starts at ${scheduledTime}`,
      tag: `live-lesson-${lessonId}`,
      data: {
        type: 'live-lesson',
        lessonId,
        url: `/live-lessons/${lessonId}`
      }
    });
  }
}

export const notificationService = NotificationService.getInstance();