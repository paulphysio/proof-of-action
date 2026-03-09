import { NextResponse } from 'next/server';
import { storeTrackingDataOnFilecoin } from '@/lib/filecoin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { trackingData, options } = body;

    if (!trackingData) {
      return NextResponse.json({
        success: false,
        error: 'Missing tracking data'
      }, { status: 400 });
    }

    console.log('📤 Storing movement tracking data on Filecoin...');
    const result = await storeTrackingDataOnFilecoin(trackingData, options);
    
    return NextResponse.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('❌ Failed to store tracking data:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
