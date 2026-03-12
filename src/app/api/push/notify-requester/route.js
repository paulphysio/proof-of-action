import { NextResponse } from 'next/server';
import { getSupabaseServerClient, sendPush } from '../_utils';

export async function POST(req) {
  try {
    const body = await req.json();
    const requesterWallet = typeof body?.requesterWallet === 'string' ? body.requesterWallet : null;
    const requestId = body?.requestId;

    if (!requesterWallet || !requestId) {
      return NextResponse.json({ error: 'Missing requesterWallet or requestId' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, subscription')
      .eq('wallet_address', requesterWallet);

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to load subscriptions', details: error }, { status: 500 });
    }

    const payload = {
      title: '[HANDSHAKE] Someone Offered to Help',
      body: 'A nearby helper responded to your request. Open the app to view details.',
      tag: `response-${requestId}`,
      actions: [{ action: 'view', title: 'View' }],
      url: '/dashboard'
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
