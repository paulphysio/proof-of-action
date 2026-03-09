import { NextResponse } from 'next/server';
import { storeVerificationProofOnFilecoin } from '@/lib/filecoin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { verificationData, options } = body;

    if (!verificationData) {
      return NextResponse.json({
        success: false,
        error: 'Missing verification data'
      }, { status: 400 });
    }

    console.log('📤 Storing verification proof on Filecoin...');
    const result = await storeVerificationProofOnFilecoin(verificationData, options);
    
    return NextResponse.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('❌ Failed to store verification proof:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
