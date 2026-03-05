import { getFilecoinStorageStatus } from '@/lib/filecoin-real';

/**
 * API route to get Filecoin storage status
 * Runs on server where PRIVATE_KEY is available
 */
export async function GET() {
  try {
    const status = await getFilecoinStorageStatus();
    
    return Response.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Filecoin status API error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
