import { NextResponse } from 'next/server';
import { storeReputationOnFilecoin } from '@/lib/filecoin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { walletAddress, reputationData, options } = body;

    if (!walletAddress || !reputationData) {
      return NextResponse.json({
        success: false,
        error: 'Missing wallet address or reputation data'
      }, { status: 400 });
    }

    console.log('📤 Storing reputation on Filecoin...');
    const result = await storeReputationOnFilecoin(walletAddress, reputationData, options);
    
    return NextResponse.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('❌ Failed to store reputation:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
