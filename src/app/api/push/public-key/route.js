import { NextResponse } from 'next/server';
import { configureWebPush } from '../_utils';

export async function GET() {
  try {
    const { publicKey } = configureWebPush();
    return NextResponse.json({ publicKey });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Failed to load VAPID public key' }, { status: 500 });
  }
}
