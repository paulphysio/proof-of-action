/**
 * Filecoin Integration for Proof-of-Action
 * 
 * NOW USING REAL FILECOIN SYNAPSE SDK
 * Production-ready decentralized storage on Filecoin network
 * 
 * Challenge: Filecoin - Agent Reputation & Portable Identity
 * 
 * FEATURES:
 * ✅ Real Filecoin storage (not mock)
 * ✅ Synapse SDK integration
 * ✅ USDFC payment system
 * ✅ CDN acceleration
 * ✅ Multi-provider redundancy
 * ✅ Metadata tagging
 * ✅ Emergency proof persistence
 */

// Import real Filecoin implementation
import {
  storeDataOnFilecoin,
  retrieveDataFromFilecoin,
  storeWorldIDVerificationOnFilecoin,
  storeEmergencyResponseOnFilecoin,
  storeReputationOnFilecoin,
  getFilecoinStorageStatus,
  createFilecoinStorageContext
} from './filecoin-real';

// Re-export all real functions
export {
  storeDataOnFilecoin,
  retrieveDataFromFilecoin,
  storeWorldIDVerificationOnFilecoin,
  storeEmergencyResponseOnFilecoin,
  storeReputationOnFilecoin,
  getFilecoinStorageStatus,
  createFilecoinStorageContext
};

// Legacy function names for backward compatibility
export async function storeOnFilecoin(data, type = 'data') {
  return storeDataOnFilecoin(data, { type });
}

export async function storeTrackingDataOnFilecoin(trackingData) {
  return storeEmergencyResponseOnFilecoin(trackingData);
}

export async function storeRequestOnFilecoin(request) {
  return storeEmergencyResponseOnFilecoin(request);
}

export async function storeVerificationProofOnFilecoin(proof) {
  return storeWorldIDVerificationOnFilecoin(proof.walletAddress || 'unknown', proof);
}

// Local storage reference for UI display
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
