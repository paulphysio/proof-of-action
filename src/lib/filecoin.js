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

/**
 * Store data on Filecoin Calibration Testnet
 * Uses the API route that executes filecoin-pin CLI
 * 
 * @param {Object} data - Data to store
 * @param {string} type - Type of data (tracking, reputation, request)
 * @returns {Promise<{success: boolean, cid?: string, error?: string}>}
 */
export async function storeOnFilecoin(data, type = 'data') {
  try {
    // Call the API route that handles filecoin-pin CLI
    const response = await fetch('/api/filecoin/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data,
        type,
        metadata: {
          timestamp: Date.now(),
          app: 'proof-of-action'
        }
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Storage failed');
    }

    // Store the result locally for reference
    if (typeof window !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem('filecoin_storage') || '[]');
      existing.push({
        type,
        cid: result.cid,
        timestamp: result.timestamp,
        network: result.network,
        url: result.url,
        explorer: result.explorer
      });
      localStorage.setItem('filecoin_storage', JSON.stringify(existing));
    }

    console.log(`✅ Filecoin storage:`, {
      type,
      cid: result.cid,
      network: result.network,
      explorer: result.explorer
    });

    return {
      success: true,
      cid: result.cid,
      url: result.url,
      explorer: result.explorer,
      ipfs: result.ipfs,
      timestamp: result.timestamp,
      network: result.network,
      isMock: result.isMock || false
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
 * Store verification proof on Filecoin
 * @param {Object} proof - Verification proof data
 */
export async function storeVerificationProofOnFilecoin(proof) {
  return storeOnFilecoin({
    ...proof,
    category: 'verification_proof'
  }, 'verification');
}

/**
 * Get all stored Filecoin records from local reference
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
  
  const realStorage = storage.filter(s => s.network === 'filecoin_calibration');
  
  return {
    totalStored: storage.length,
    realStorage: realStorage.length,
    mockStorage: storage.length - realStorage.length,
    reputationRecords: storage.filter(s => s.type === 'reputation').length,
    trackingRecords: storage.filter(s => s.type === 'movement').length,
    requestRecords: storage.filter(s => s.type === 'request').length,
    verificationRecords: storage.filter(s => s.type === 'verification').length,
    lastStored: storage.length > 0 ? storage[storage.length - 1].timestamp : null,
    hasRealStorage: realStorage.length > 0,
    calibrationCids: realStorage.map(s => s.cid)
  };
}

/**
 * Check if Filecoin CLI is available
 */
export async function checkFilecoinStatus() {
  try {
    const response = await fetch('/api/filecoin/store');
    return await response.json();
  } catch (error) {
    return {
      available: false,
      message: error.message
    };
  }
}

/**
 * Check if Filecoin is available (simplified version)
 */
export async function isFilecoinAvailable() {
  try {
    const response = await fetch('/api/filecoin/store');
    const result = await response.json();
    return result.available !== false;
  } catch (error) {
    return false;
  }
}

/**
 * Get Filecoin explorer URL for a CID
 * @param {string} cid - Content Identifier
 */
export function getFilecoinExplorerUrl(cid) {
  return `https://calibration.filscan.io/en/cid/${cid}`;
}

/**
 * Get IPFS gateway URL for a CID
 * @param {string} cid - Content Identifier
 */
export function getIpfsUrl(cid) {
  return `https://ipfs.io/ipfs/${cid}`;
}

/**
 * Clear storage reference (for testing)
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
  storeVerificationProofOnFilecoin,
  getFilecoinStorage,
  getFilecoinStorageStats,
  checkFilecoinStatus,
  isFilecoinAvailable,
  getFilecoinExplorerUrl,
  getIpfsUrl,
  clearFilecoinStorage
};
