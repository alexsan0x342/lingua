/**
 * Register service worker for push notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('[SW] Service workers are not supported in this browser');
    return null;
  }

  try {
    console.log('[SW] Checking for existing service worker registration...');
    let registration = await navigator.serviceWorker.getRegistration('/');
    
    if (registration) {
      console.log('[SW] Found existing registration:', registration);
      // Update the registration to ensure latest SW is used
      try {
        await registration.update();
        console.log('[SW] Service worker updated');
      } catch (updateError) {
        console.warn('[SW] Failed to update service worker:', updateError);
      }
    } else {
      console.log('[SW] No existing registration, registering new service worker...');
      registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('[SW] Service Worker registered successfully:', registration);
    }

    // Wait for the service worker to be ready
    console.log('[SW] Waiting for service worker to be ready...');
    const readyRegistration = await navigator.serviceWorker.ready;
    console.log('[SW] Service Worker is ready, state:', readyRegistration.active?.state);

    return readyRegistration;
  } catch (error) {
    console.error('[SW] Service Worker registration failed:', error);
    throw error;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const success = await registration.unregister();
      console.log('[SW] Service Worker unregistered:', success);
      return success;
    }
    return false;
  } catch (error) {
    console.error('[SW] Service Worker unregistration failed:', error);
    return false;
  }
}

/**
 * Check if service worker is registered and active
 */
export async function isServiceWorkerActive(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration?.active !== null && registration?.active !== undefined;
  } catch (error) {
    console.error('[SW] Failed to check service worker status:', error);
    return false;
  }
}
