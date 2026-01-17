// Service Worker for Push Notifications
// This allows notifications to work even when the browser is in the background

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'New Notification',
        body: event.data.text(),
      };
    }
  }

  const title = data.title || 'LMS Notification';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/logo.svg',
    badge: '/logo.svg',
    vibrate: [200, 100, 200],
    tag: data.tag || 'lms-notification',
    data: data.data || {},
    requireInteraction: false,
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed', event.notification);
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    // Fetch pending notifications when back online
    const response = await fetch('/api/notifications?unread=true');
    const data = await response.json();
    
    if (data.notifications && data.notifications.length > 0) {
      // Show a summary notification
      await self.registration.showNotification('New Updates', {
        body: `You have ${data.notifications.length} new notification(s)`,
        icon: '/logo.svg',
        badge: '/logo.svg',
        tag: 'sync-summary',
        data: { url: '/notifications' },
      });
    }
  } catch (error) {
    console.error('[Service Worker] Failed to sync notifications:', error);
  }
}
