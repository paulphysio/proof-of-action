import { NextResponse } from 'next/server';
import { configureWebPush } from '../_utils';

export async function GET() {
  try {
    const { publicKey } = configureWebPush();
    return NextResponse.json({ publicKey });
  } catch (e) {
    // Return null instead of error so client can gracefully handle
    return NextResponse.json({ publicKey: null, error: e?.message || 'VAPID not configured' });
  }
}
