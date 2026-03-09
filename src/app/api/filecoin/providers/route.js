import { NextResponse } from 'next/server';
import { getStorageProviders } from '@/lib/filecoin-real';

export async function GET() {
  try {
    console.log('📋 Fetching storage providers...');
    const providers = await getStorageProviders();
    
    // Manually convert all BigInt values to numbers and ensure serializability
    const serializableProviders = providers.map(provider => {
      const serialized = { ...provider };
      
      // Convert BigInt id to number
      if (typeof serialized.id === 'bigint') {
        serialized.id = Number(serialized.id);
      }
      
      // Ensure all other values are serializable
      Object.keys(serialized).forEach(key => {
        const value = serialized[key];
        if (typeof value === 'bigint') {
          serialized[key] = Number(value);
        } else if (value && typeof value === 'object') {
          // Handle nested objects like pdp
          Object.keys(value).forEach(nestedKey => {
            if (typeof value[nestedKey] === 'bigint') {
              value[nestedKey] = Number(value[nestedKey]);
            }
          });
        }
      });
      
      return serialized;
    });
    
    console.log(`✅ Successfully fetched ${serializableProviders.length} storage providers`);
    
    return NextResponse.json({
      success: true,
      providers: serializableProviders,
      count: serializableProviders.length
    });
  } catch (error) {
    console.error('❌ Failed to fetch storage providers:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      providers: []
    }, { status: 500 });
  }
}
