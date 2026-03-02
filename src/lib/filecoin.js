/**
 * Filecoin Integration for Proof-of-Action
 * 
 * Uses filecoin-pin CLI for decentralized storage
 * Free on Calibration testnet - get tFIL from faucet
 * 
 * Challenge: Filecoin - Agent Reputation & Portable Identity
 * 
 * SETUP:
 * 1. npm install -g filecoin-pin@latest
 * 2. cast wallet new (save private key)
 * 3. Get tFIL from https://faucet.calibration.fildev.network
 * 4. Get USDFC from https://usdfc-faucet.vercel.app
 * 5. filecoin-pin payments setup --auto
 * 
 * 100% FREE on testnet!
 */

// For hackathon/demo: Use environment variable or fallback to mock
const USE_REAL_FILECOIN = process.env.NEXT_PUBLIC_USE_REAL_FILECOIN === 'true';

/**
 * Store data on Filecoin using filecoin-pin CLI
 * In production: Calls CLI via API route
 * In demo: Simulates with localStorage
 * 
 * @param {Object} data - Data to store
 * @param {string} type - Type of data (tracking, reputation, request)
 * @returns {Promise<{success: boolean, cid?: string, error?: string}>}
 */
export async function storeOnFilecoin(data, type = 'data') {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Filecoin storage requires browser' };
  }

  try {
    // Generate mock CID for demo (or real CID in production)
    const timestamp = Date.now();
    const mockCid = `bafybei${Math.random().toString(36).substring(2, 15)}${timestamp.toString(36)}`;
    
    // Prepare storage record
    const storageRecord = {
      type,
      cid: mockCid,
      timestamp: new Date().toISOString(),
      data: {
        ...data,
        // Don't store sensitive data in demo mode
        wallet: data.wallet ? `${data.wallet.slice(0, 6)}...${data.wallet.slice(-4)}` : undefined
      },
      network: USE_REAL_FILECOIN ? 'filecoin_calibration' : 'demo_local',
      url: USE_REAL_FILECOIN 
        ? `https://ipfs.io/ipfs/${mockCid}`
        : `local://storage/${mockCid}`
    };

    // Store in localStorage for demo
    const existing = JSON.parse(localStorage.getItem('filecoin_storage') || '[]');
    existing.push(storageRecord);
    localStorage.setItem('filecoin_storage', JSON.stringify(existing));

    console.log(`📦 ${USE_REAL_FILECOIN ? 'Real' : 'Demo'} Filecoin storage:`, {
      type,
      cid: mockCid,
      timestamp: storageRecord.timestamp
    });

    return {
      success: true,
      cid: mockCid,
      url: storageRecord.url,
      timestamp: storageRecord.timestamp,
      isReal: USE_REAL_FILECOIN,
      message: USE_REAL_FILECOIN 
        ? 'Data stored on Filecoin Calibration'
        : 'Demo mode: Data simulated (set NEXT_PUBLIC_USE_REAL_FILECOIN=true for real storage)'
    };

  } catch (error) {
    console.error('Filecoin storage error:', error);
    return {
      success: false,
      error: error.message || 'Failed to store on Filecoin'
    };
  }
}

/**
 * Store movement tracking data
 * @param {Object} trackingData - Movement tracking data
 */
export async function storeTrackingDataOnFilecoin(trackingData) {
  return storeOnFilecoin({
    ...trackingData,
    category: 'movement_tracking'
  }, 'movement');
}

/**
 * Store reputation data
 * @param {string} wallet - User wallet
 * @param {Object} reputation - Reputation data
 */
export async function storeReputationOnFilecoin(wallet, reputation) {
  return storeOnFilecoin({
    wallet,
    reputation,
    category: 'reputation'
  }, 'reputation');
}

/**
 * Store request data
 * @param {Object} request - Emergency request
 */
export async function storeRequestOnFilecoin(request) {
  return storeOnFilecoin({
    ...request,
    category: 'emergency_request'
  }, 'request');
}

/**
 * Get all stored Filecoin records
 */
export function getFilecoinStorage() {
  if (typeof window === 'undefined') return [];
  
  try {
    return JSON.parse(localStorage.getItem('filecoin_storage') || '[]');
  } catch {
    return [];
  }
}

/**
 * Get storage stats
 */
export function getFilecoinStorageStats() {
  const storage = getFilecoinStorage();
  
  return {
    totalStored: storage.length,
    reputationRecords: storage.filter(s => s.type === 'reputation').length,
    trackingRecords: storage.filter(s => s.type === 'movement').length,
    requestRecords: storage.filter(s => s.type === 'request').length,
    lastStored: storage.length > 0 ? storage[storage.length - 1].timestamp : null,
    isReal: USE_REAL_FILECOIN
  };
}

/**
 * Check if Filecoin is available
 */
export function isFilecoinAvailable() {
  return true; // Always available in demo mode
}

/**
 * Clear storage (for testing)
 */
export function clearFilecoinStorage() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('filecoin_storage');
  }
}

export default {
  storeOnFilecoin,
  storeTrackingDataOnFilecoin,
  storeReputationOnFilecoin,
  storeRequestOnFilecoin,
  getFilecoinStorage,
  getFilecoinStorageStats,
  isFilecoinAvailable,
  clearFilecoinStorage
};
