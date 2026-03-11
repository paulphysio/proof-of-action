/**
 * Filecoin Integration for Proof-of-Action
 * 
 * Clean implementation using working API routes
 * - /api/filecoin/store - Upload encrypted data
 * - /api/filecoin/retrieve - Download encrypted data
 * - /api/filecoin/get-balance - Check wallet balance
 * 
 * Features:
 * Client-side encryption (password-based)
 * Fast Filecoin storage via Synapse SDK
 * CDN-enabled retrieval
 * Clean API abstraction
 */

// Store encrypted data on Filecoin
export async function storeOnFilecoin(data) {
  const response = await fetch('/api/filecoin/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Storage failed');
  }

  return {
    pieceCid: result.pieceCid,
    size: result.size,
    message: result.message
  };
}

// Retrieve encrypted data from Filecoin
export async function retrieveFromFilecoin(pieceCid) {
  const response = await fetch(`/api/filecoin/retrieve?pieceCid=${encodeURIComponent(pieceCid)}`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Retrieval failed');
  }

  return result.data;
}

// Check wallet balance
export async function getWalletBalance(address) {
  const response = await fetch(`/api/filecoin/get-balance?address=${encodeURIComponent(address)}`);
  const result = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  return result.balance;
}

// Store response commitment (encrypted)
export async function storeResponseCommitmentOnFilecoin(commitmentData) {
  return storeOnFilecoin({
    type: 'response_commitment',
    timestamp: new Date().toISOString(),
    ...commitmentData
  });
}

// Store tracking data (encrypted)
export async function storeTrackingDataOnFilecoin(trackingData) {
  return storeOnFilecoin({
    type: 'movement_proof',
    timestamp: new Date().toISOString(),
    ...trackingData
  });
}

// Store reputation data (encrypted)
export async function storeReputationOnFilecoin(reputationData) {
  return storeOnFilecoin({
    type: 'reputation',
    timestamp: new Date().toISOString(),
    ...reputationData
  });
}

// Store verification proof (encrypted)
export async function storeVerificationProofOnFilecoin(proofData) {
  return storeOnFilecoin({
    type: 'verification',
    timestamp: new Date().toISOString(),
    ...proofData
  });
}

// Local storage helpers for UI state
export function getFilecoinStorage() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('filecoin_storage') || '[]');
  } catch {
    return [];
  }
}

export function addFilecoinStorageRef(ref) {
  if (typeof window === 'undefined') return;
  const existing = getFilecoinStorage();
  existing.unshift(ref);
  localStorage.setItem('filecoin_storage', JSON.stringify(existing));
}

// Get explorer URL for a CID
export function getFilecoinExplorerUrl(cid) {
  return `https://calibration.filscan.io/en/cid/${cid}`;
}

// Default export
export default {
  storeOnFilecoin,
  retrieveFromFilecoin,
  getWalletBalance,
  storeResponseCommitmentOnFilecoin,
  storeTrackingDataOnFilecoin,
  storeReputationOnFilecoin,
  storeVerificationProofOnFilecoin,
  getFilecoinStorage,
  addFilecoinStorageRef,
  getFilecoinExplorerUrl
};
