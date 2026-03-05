import { NextResponse } from 'next/server';

/**
 * Generate RP signature for World ID verification
 * This is required for IDKit v4+ 
 */

export async function POST(request) {
  try {
    const { action, signal } = await request.json();
    
    // For development/hackathon without proper signing key
    // Generate a mock RP context that IDKit will accept in staging
    // In production, you should use @worldcoin/idkit-server signRequest()
    
    const nonce = crypto.randomUUID();
    const createdAt = Math.floor(Date.now() / 1000);
    const expiresAt = createdAt + 3600; // 1 hour expiry
    
    // Create a simple signature (for demo purposes)
    // In production, this should be properly signed with your RP signing key
    const sig = `demo_sig_${nonce}`;
    
    return NextResponse.json({
      sig,
      nonce,
      created_at: createdAt,
      expires_at: expiresAt,
      rp_id: process.env.WORLD_RP_ID || 'rp_proof_of_action_demo'
    });
  } catch (error) {
    console.error('RP signature error:', error);
    return NextResponse.json(
      { error: 'Failed to generate RP signature' },
      { status: 500 }
    );
  }
}
