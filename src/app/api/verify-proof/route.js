import { NextResponse } from 'next/server';

/**
 * Verify World ID proof
 * Forwards to World ID API for verification
 */

export async function POST(request) {
  try {
    const { rp_id, idkitResponse } = await request.json();

    const apiKey = process.env.WORLD_DEVELOPER_API_KEY || process.env.WORLD_API_KEY || process.env.DEVELOPER_PORTAL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Missing World Developer API key for proof verification',
          detail:
            'Set WORLD_DEVELOPER_API_KEY (from Developer Portal) in your server env. This key is required as Authorization: Bearer <api_key> when calling https://developer.world.org/api/v4/verify/{rp_id}.',
        },
        { status: 500 },
      );
    }
    
    // Forward to World ID verification API
    // Use staging for testing, production for live
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://developer.world.org/api/v4/verify'
      : 'https://developer.worldcoin.org/api/v4/verify';
    
    const response = await fetch(
      `${baseUrl}/${rp_id}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(idkitResponse),
      }
    );

    console.log('World ID verification request:', {
      url: `${baseUrl}/${rp_id}`,
      status: response.status,
      ok: response.ok,
      rp_id,
      appId: process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID
    });

    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }

    if (!response.ok) {
      console.error('World ID verify failed:', {
        status: response.status,
        rp_id,
        payload,
      });
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify proof' },
      { status: 500 }
    );
  }
}
