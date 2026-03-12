import { NextResponse } from 'next/server';
import { getSupabaseServerClient, sendPush } from '../_utils';

// Haversine formula to calculate distance between two points in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const request = body?.request;
    const requestLocation = body?.location; // { lat, lng }

    if (!request?.id) {
      return NextResponse.json({ error: 'Missing request payload' }, { status: 400 });
    }

    // If location provided, use precise 1km radius
    // Otherwise fall back to geohash prefix matching
    const usePreciseRadius = requestLocation?.lat && requestLocation?.lng;

    const supabase = getSupabaseServerClient();
    let subs = [];

    if (usePreciseRadius) {
      // Get all subscriptions with location data
      const { data: allSubs, error } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, subscription, wallet_address, location_lat, location_lng, last_location_at');

      if (error) {
        return NextResponse.json({ error: error.message || 'Failed to load subscriptions', details: error }, { status: 500 });
      }

      // Filter subscriptions within 1km radius
      subs = (allSubs || []).filter(sub => {
        if (!sub.location_lat || !sub.location_lng) return false;
        
        // Check if location is fresh (within last 24 hours)
        const locationAge = sub.last_location_at 
          ? Date.now() - new Date(sub.last_location_at).getTime()
          : Infinity;
        const isFresh = locationAge < 24 * 60 * 60 * 1000; // 24 hours
        
        if (!isFresh) return false;

        const distance = calculateDistance(
          requestLocation.lat,
          requestLocation.lng,
          sub.location_lat,
          sub.location_lng
        );
        
        return distance <= 1; // Within 1km
      });
    } else {
      // Fall back to geohash prefix matching
      const prefixes = Array.isArray(body?.geohashPrefixes)
        ? body.geohashPrefixes.filter((p) => typeof p === 'string' && p.length > 0)
        : [];

      if (prefixes.length === 0) {
        return NextResponse.json({ ok: true, sent: 0, reason: 'No location data provided' });
      }

      const { data: geohashSubs, error } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, subscription, wallet_address, geohash_prefixes')
        .overlaps('geohash_prefixes', prefixes);

      if (error) {
        return NextResponse.json({ error: error.message || 'Failed to load subscriptions', details: error }, { status: 500 });
      }

      subs = geohashSubs || [];
    }

    const payload = {
      title: '[EMERGENCY] Emergency Nearby!',
      body: `Someone needs ${request.request_type || 'help'} nearby. Can you help?`,
      tag: `emergency-${request.id}`,
      requireInteraction: true,
      actions: [
        { action: 'respond', title: 'Respond' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      data: {
        url: '/respond',
        requestId: request.id,
        distance: usePreciseRadius ? 'within 1km' : 'nearby'
      }
    };

    const results = await Promise.allSettled(
      subs.map((row) => sendPush(row.subscription, payload))
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({ 
      ok: true, 
      sent, 
      failed, 
      radius: usePreciseRadius ? '1km' : 'geohash',
      recipients: subs.length 
    });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}
