/**
 * Push Notification Utilities for PWA
 */

// Register service worker
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
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
    
    // In production, you would get this from your server
    // For demo, we'll simulate the subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'BEl62iTMgUfis1J0L9ZlJ-1rPqF0z5P6g6z6Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9'
      )
    });
    
    console.log('Push subscription:', subscription);
    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

// Send local notification
export function sendLocalNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log('Notifications not available or permission denied');
    return;
  }

  const defaultOptions = {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: 'proof-of-action',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // Actions are not supported for non-persistent notifications created via `new Notification()`.
  // If actions are present, prefer showing a persistent notification via the Service Worker.
  if (
    Array.isArray(mergedOptions.actions) &&
    mergedOptions.actions.length > 0 &&
    'serviceWorker' in navigator
  ) {
    navigator.serviceWorker.ready
      .then((registration) => {
        return registration.showNotification(title, mergedOptions);
      })
      .catch((error) => {
        console.error('Persistent notification failed, falling back:', error);

        // Fallback: show a basic notification without actions.
        const { actions, ...fallbackOptions } = mergedOptions;
        const notification = new Notification(title, fallbackOptions);
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        return notification;
      });

    return;
  }

  // Basic notification (no actions)
  const { actions, ...fallbackOptions } = mergedOptions;
  const notification = new Notification(title, fallbackOptions);

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return notification;
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

// Show action confirmation notification
export function notifyActionConfirmed(response) {
  return sendLocalNotification(
    '✅ Action Confirmed!',
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
