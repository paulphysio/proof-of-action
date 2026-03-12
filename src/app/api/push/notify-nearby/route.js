import { NextResponse } from 'next/server';
import { getSupabaseServerClient, sendPush } from '../_utils';

export async function POST(req) {
  try {
    const body = await req.json();
    const request = body?.request;

    if (!request?.id || typeof request?.geohash !== 'string') {
      return NextResponse.json({ error: 'Missing request payload' }, { status: 400 });
    }

    const prefixes = Array.isArray(body?.geohashPrefixes)
      ? body.geohashPrefixes.filter((p) => typeof p === 'string' && p.length > 0)
      : [];

    if (prefixes.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'No prefixes provided' });
    }

    const supabase = getSupabaseServerClient();

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, subscription, wallet_address, geohash_prefixes')
      .overlaps('geohash_prefixes', prefixes);

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to load subscriptions', details: error }, { status: 500 });
    }

    const payload = {
      title: '[EMERGENCY] Emergency Nearby!',
      body: `Someone needs ${request.request_type || 'help'} nearby. Can you help?`,
      tag: `emergency-${request.id}`,
      actions: [
        { action: 'respond', title: 'Respond' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      url: '/respond'
    };

    const results = await Promise.allSettled(
      (subs || []).map((row) => sendPush(row.subscription, payload))
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({ ok: true, sent, failed });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}
