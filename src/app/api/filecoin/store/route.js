import { NextResponse } from 'next/server';
import { 
  storeWorldIDVerificationOnFilecoin, 
  storeEmergencyResponseOnFilecoin, 
  storeReputationOnFilecoin,
  storeDataOnFilecoin 
} from '@/lib/filecoin-real';

/**
 * Filecoin Storage API Route
 * Stores data on Filecoin using real Synapse SDK
 * 
 * Required env vars:
 * - PRIVATE_KEY (for Synapse SDK)
 */

export async function POST(request) {
  try {
    const body = await request.json();
    const { data, type = 'data', walletAddress, metadata = {} } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'No data provided' },
        { status: 400 }
      );
    }

    let result;
    
    switch (type) {
      case 'world-id':
        result = await storeWorldIDVerificationOnFilecoin(walletAddress, data);
        break;
      case 'emergency':
        result = await storeEmergencyResponseOnFilecoin(data);
        break;
      case 'reputation':
        result = await storeReputationOnFilecoin(walletAddress, data);
        break;
      default:
        result = await storeDataOnFilecoin(data, { type, ...metadata });
    }
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Filecoin storage error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to store on Filecoin',
        success: false 
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Check Filecoin storage status
 */
export async function GET() {
  try {
    const { getFilecoinStorageStatus } = await import('@/lib/filecoin-real');
    const status = await getFilecoinStorageStatus();
    
    return NextResponse.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('Filecoin status error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to get Filecoin status',
        success: false 
      },
      { status: 500 }
    );
  }
}
