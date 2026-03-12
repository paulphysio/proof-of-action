import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../_utils';

export async function POST(req) {
  try {
    const body = await req.json();
    const walletAddress = typeof body?.walletAddress === 'string' ? body.walletAddress : null;
    const subscription = body?.subscription;
    const endpoint = subscription?.endpoint;
    const geohashPrefixes = Array.isArray(body?.geohashPrefixes) ? body.geohashPrefixes : [];
    const location = body?.location; // { lat, lng }
    
    if (!endpoint || typeof endpoint !== 'string') {
      return NextResponse.json({ error: 'Missing subscription endpoint' }, { status: 400 });
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project')) {
      console.warn('Supabase not configured. Push subscription skipped.');
      return NextResponse.json({ 
        ok: true, 
        warning: 'Supabase not configured - subscription not saved to database',
        subscription: { endpoint: endpoint.slice(0, 50) + '...' }
      });
    }

    let supabase;
    try {
      supabase = getSupabaseServerClient();
    } catch (err) {
      console.warn('Supabase client error:', err.message);
      return NextResponse.json({ 
        ok: true, 
        warning: 'Database not ready - subscription saved locally only',
        subscription: { endpoint: endpoint.slice(0, 50) + '...' }
      });
    }

    // Prepare upsert data
    const upsertData = {
      wallet_address: walletAddress,
      endpoint,
      subscription,
      geohash_prefixes: geohashPrefixes,
      updated_at: new Date().toISOString()
    };

    // Add location if provided
    if (location?.lat && location?.lng) {
      upsertData.location_lat = location.lat;
      upsertData.location_lng = location.lng;
      upsertData.last_location_at = new Date().toISOString();
    }

    // Upsert by endpoint (unique)
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(upsertData, { onConflict: 'endpoint' })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      // Return success but log error - don't break the UX
      return NextResponse.json({ 
        ok: true, 
        warning: 'Database error - subscription may not be persisted',
        error: error.message 
      });
    }

    return NextResponse.json({ ok: true, subscription: data });
  } catch (e) {
    console.error('Push subscription error:', e);
    return NextResponse.json({ 
      ok: true,  // Return OK to not break UX
      warning: 'Server error - subscription handled locally',
      error: e?.message 
    });
  }
}
