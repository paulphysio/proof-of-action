/**
 * Push Notification Utilities for PWA
 */

// Register service worker
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported');
    return null;
  }
  
  try {
    // Check if already registered
    const existingRegistration = await navigator.serviceWorker.getRegistration();
    if (existingRegistration) {
      console.log('Service Worker already registered:', existingRegistration);
      return existingRegistration;
    }
    
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none'
    });
    console.log('Service Worker registered:', registration);
    
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    
    return registration;
  } catch (error) {
    console.warn('Service Worker registration failed:', error.message);
    return null;
  }
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Subscribe to push notifications
export async function subscribeToPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;

    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    const res = await fetch('/api/push/public-key');
    if (!res.ok) {
      console.warn('Push notification setup incomplete - VAPID keys may not be configured');
      return null;
    }

    const { publicKey, error } = await res.json();
    
    // Gracefully handle missing VAPID configuration
    if (!publicKey || typeof publicKey !== 'string') {
      if (error) {
        console.warn('Push notifications not available:', error);
      }
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    
    console.log('Push subscription:', subscription);
    return subscription;
  } catch (error) {
    console.warn('Push subscription failed (notifications may not be available):', error);
    return null;
  }
}

export async function savePushSubscription(subscription, walletAddress, geohashPrefixes = []) {
  try {
    if (!subscription) return null;

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription,
        walletAddress: walletAddress || null,
        geohashPrefixes: Array.isArray(geohashPrefixes) ? geohashPrefixes : []
      })
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.error || 'Failed to save push subscription');
    }

    return json;
  } catch (error) {
    console.error('Saving push subscription failed:', error);
    return null;
  }
}

// Send local notification
export function sendLocalNotification(title, options = {}) {
  if (!('Notification' in window)) {
    console.log('🔕 Notifications not supported in this browser');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.log('🔕 Notification permission not granted');
    return;
  }

  // Check if we're on HTTPS (required for notifications)
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    console.warn('🔕 Notifications require HTTPS in production. Current protocol:', location.protocol);
    return;
  }

  const defaultOptions = {
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg',
    tag: 'proof-of-action',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // Try service worker first (better for HTTPS)
  if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready
      .then((registration) => {
        console.log('🔔 Showing notification via service worker');
        return registration.showNotification(title, mergedOptions);
      })
      .catch((error) => {
        console.warn('Service worker notification failed, falling back:', error);
        showFallbackNotification(title, mergedOptions);
      });
  } else {
    showFallbackNotification(title, mergedOptions);
  }
}

// Fallback notification for when service worker fails
function showFallbackNotification(title, options) {
  try {
    console.log('🔔 Showing fallback notification');
    const { actions, ...fallbackOptions } = options;
    const notification = new Notification(title, fallbackOptions);
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    return notification;
  } catch (error) {
    console.error('Fallback notification failed:', error);
  }
}

// Show nearby emergency notification
export function notifyNearbyEmergency(request) {
  return sendLocalNotification(
    '🚨 Emergency Nearby!',
    {
      body: `Someone needs ${request.request_type} nearby. Can you help?`,
      tag: `emergency-${request.id}`,
      actions: [
        { action: 'respond', title: 'Respond' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      data: { requestId: request.id }
    }
  );
}

// Show tracking started notification
export function notifyTrackingStarted(request) {
  return sendLocalNotification(
    '📍 Help Session Started',
    {
      body: `You're now helping with "${request.request_type}". Movement tracking is active.`,
      tag: `tracking-${request.id}`,
      actions: [
        { action: 'view', title: 'View Progress' }
      ]
    }
  );
}

// Show action confirmation notification (called AFTER verification)
export function notifyActionConfirmed(response) {
  return sendLocalNotification(
    '✅ Action Verified!',
    {
      body: 'Your helpful action has been verified. You earned 10 Proof Points!',
      tag: `confirmation-${response.id}`,
      actions: [
        { action: 'view', title: 'View Rewards' }
      ]
    }
  );
}

// Show reward notification
export function notifyRewardReceived(reward) {
  return sendLocalNotification(
    '🎉 Reward Received!',
    {
      body: `You received ${reward.amount} tokens for: ${reward.reason}`,
      tag: `reward-${reward.id}`,
      actions: [
        { action: 'view', title: 'View Balance' }
      ]
    }
  );
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
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

// Install PWA prompt
export function installPWA() {
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  return {
    prompt: async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        return outcome === 'accepted';
      }
      return false;
    },
    isAvailable: () => !!deferredPrompt
  };
}
