import { NextResponse } from 'next/server';
import { storeResponseCommitmentOnFilecoin } from '@/lib/filecoin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { commitmentData, options } = body;

    if (!commitmentData) {
      return NextResponse.json({
        success: false,
        error: 'Missing commitment data'
      }, { status: 400 });
    }

    console.log('📤 Starting response commitment storage...');
    
    // Start storage in background but return immediately with pending status
    const storagePromise = storeResponseCommitmentOnFilecoin(commitmentData, options);
    
    // Generate a temporary pieceCid for immediate UI feedback
    const tempPieceCid = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Process storage in background
    storagePromise.then(result => {
      console.log('✅ Background storage completed:', result.pieceCid);
    }).catch(error => {
      console.error('❌ Background storage failed:', error);
    });

    // Return immediate response with temp ID
    return NextResponse.json({
      success: true,
      result: {
        pieceCid: tempPieceCid,
        pending: true,
        message: 'Commitment accepted and being stored on Filecoin'
      }
    });
  } catch (error) {
    console.error('❌ Failed to store response commitment:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
