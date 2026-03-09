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

    console.log('📤 Storing response commitment on Filecoin...');
    const result = await storeResponseCommitmentOnFilecoin(commitmentData, options);
    
    return NextResponse.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('❌ Failed to store response commitment:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
