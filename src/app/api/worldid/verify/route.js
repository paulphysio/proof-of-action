import { NextResponse } from 'next/server';

/**
 * World ID Verification API Route
 * Verifies World ID proofs on the backend
 * 
 * Challenge: World Build 3 - The Human-Centric App Challenge
 */

export async function POST(request) {
  try {
    const body = await request.json();
    const { nullifier_hash, proof, merkle_root, verification_level, action, signal } = body;

    // Validate required fields
    if (!nullifier_hash || !proof || !merkle_root) {
      return NextResponse.json(
        { success: false, error: 'Missing required verification fields' },
        { status: 400 }
      );
    }

    // In production, you would verify the proof with World ID's API
    // For now, we accept the proof and store it
    // TODO: Add actual World ID API verification in production
    
    // Mock verification for development
    const isValid = true; // Replace with actual verification

    if (isValid) {
      return NextResponse.json({
        success: true,
        nullifier_hash,
        verification_level,
        verified_at: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid proof' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('World ID verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
