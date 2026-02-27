import webpush from 'web-push';

// Configure web-push with VAPID keys
// In production, these should be environment variables
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@proofofaction.app';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

/**
 * API Route: /api/push/notify-neighbors
 * 
 * Sends push notifications to nearby neighbors when help is completed
 * This creates social proof and encourages community participation
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { neighbors, requestType, responderWallet } = req.body;

    if (!neighbors || !Array.isArray(neighbors) || neighbors.length === 0) {
      return res.status(400).json({ error: 'No neighbors to notify' });
    }

    const results = [];
    const errors = [];

    // Send notifications to all neighbors
    for (const neighbor of neighbors) {
      try {
        if (!neighbor.subscription || !neighbor.subscription.endpoint) {
          continue;
        }

        const pushSubscription = neighbor.subscription;
        
        const notificationPayload = JSON.stringify({
          title: 'Neighbor Helped Nearby',
          body: `${responderWallet.slice(0, 8)}... helped with ${requestType}`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: `help-completed-${Date.now()}`,
          requireInteraction: false,
          data: {
            type: 'neighbor_helped',
            responderWallet,
            requestType,
            url: '/dashboard'
          }
        });

        await webpush.sendNotification(pushSubscription, notificationPayload);
        
        results.push({
          wallet: neighbor.wallet,
          status: 'sent'
        });
      } catch (error) {
        console.error(`Failed to notify neighbor ${neighbor.wallet}:`, error);
        errors.push({
          wallet: neighbor.wallet,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      notified: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error sending neighbor notifications:', error);
    return res.status(500).json({ 
      error: 'Failed to send notifications',
      details: error.message 
    });
  }
}
