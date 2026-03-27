import { NextResponse } from 'next/server';
import { signRequest } from '@worldcoin/idkit-server';

/**
 * Generate RP signature for World ID verification
 * Follows official World ID documentation
 */

export async function POST(request) {
  try {
    const { action } = await request.json();
    
    const signingKey = process.env.RP_SIGNING_KEY;
    
    if (!signingKey) {
      // For demo without proper signing key, return mock data
      // In production, RP_SIGNING_KEY must be set
      const nonce = crypto.randomUUID();
      const createdAt = Math.floor(Date.now() / 1000);
      const expiresAt = createdAt + 3600;
      
      return NextResponse.json({
        sig: 'demo_signature_' + nonce,
        nonce,
        created_at: createdAt,
        expires_at: expiresAt,
      });
    }
    
    // Proper signing using World ID's signRequest
    const { sig, nonce, createdAt, expiresAt } = signRequest(action, signingKey);
    
    return NextResponse.json({
      sig,
      nonce,
      created_at: createdAt,
      expires_at: expiresAt,
    });
  } catch (error) {
    console.error('RP signature error:', error);
    return NextResponse.json(
      { error: 'Failed to generate RP signature' },
      { status: 500 }
    );
  }
}
