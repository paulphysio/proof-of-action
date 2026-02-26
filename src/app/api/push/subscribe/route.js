import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../_utils';

export async function POST(req) {
  try {
    const body = await req.json();
    const walletAddress = typeof body?.walletAddress === 'string' ? body.walletAddress : null;
    const subscription = body?.subscription;
    const endpoint = subscription?.endpoint;
    const geohashPrefixes = Array.isArray(body?.geohashPrefixes) ? body.geohashPrefixes : [];

    if (!endpoint || typeof endpoint !== 'string') {
      return NextResponse.json({ error: 'Missing subscription endpoint' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Upsert by endpoint (unique)
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          wallet_address: walletAddress,
          endpoint,
          subscription,
          geohash_prefixes: geohashPrefixes,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'endpoint' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to save subscription', details: error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, subscription: data });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}
