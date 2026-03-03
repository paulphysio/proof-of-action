/**
 * World ID Integration for Proof-of-Action
 * 
 * This module handles World ID (Proof of Personhood) verification for the app.
 * World ID verification helps prevent fake emergency requests and verifies
 * that users are real humans, creating a "human-only" emergency network.
 * 
 * Challenge: World Build 3 - The Human-Centric App Challenge
 */

const WORLD_APP_ID = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID || 'your-app-id';
const WORLD_ACTION_ID = 'verify-human';

/**
 * Initialize World ID verification
 * @returns {Promise<{success: boolean, nullifier_hash?: string, proof?: string}>}
 */
export async function verifyWithWorldID() {
  if (typeof window === 'undefined') {
    return { success: false, error: 'World ID must be verified in browser' };
  }

  try {
    // Import IDKit from npm module
    const IDKitModule = await import('@worldcoin/idkit');
    const IDKit = IDKitModule.default || IDKitModule.IDKit;
    
    if (!IDKit || typeof IDKit.init !== 'function') {
      throw new Error('IDKit not properly imported');
    }
    
    // Initialize IDKit
    await IDKit.init();
    
    return new Promise((resolve) => {
      IDKit.open({
        app_id: WORLD_APP_ID,
        action: WORLD_ACTION_ID,
        signal: 'proof-of-action-verification',
        enableTelemetry: false,
        onSuccess: (result) => {
          console.log('World ID verification successful:', result);
          resolve({
            success: true,
            nullifier_hash: result.nullifier_hash,
            proof: result.proof,
            merkle_root: result.merkle_root,
            verification_level: result.verification_level
          });
        },
        onError: (error) => {
          console.error('World ID verification failed:', error);
          resolve({ success: false, error: error.message || 'Verification failed' });
        }
      });
    });
  } catch (error) {
    console.error('World ID initialization error:', error);
    return { success: false, error: 'Failed to initialize World ID: ' + error.message };
  }
}

/**
 * Verify World ID proof on the server/backend
 * @param {Object} proofData - The proof data from World ID
 * @returns {Promise<boolean>}
 */
export async function verifyWorldIDProof(proofData) {
  try {
    const response = await fetch('/api/worldid/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...proofData,
        action: WORLD_ACTION_ID,
        signal: 'proof-of-action-verification'
      })
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('World ID proof verification error:', error);
    return false;
  }
}

/**
 * Check if user has World ID verification in localStorage
 * @returns {Object|null}
 */
export function getWorldIDVerification() {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('worldid_verification');
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    // Check if verification is still valid (7 days)
    const isValid = Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000;
    
    return isValid ? data : null;
  } catch {
    return null;
  }
}

/**
 * Save World ID verification to localStorage
 * @param {Object} verificationData
 */
export function saveWorldIDVerification(verificationData) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('worldid_verification', JSON.stringify({
      ...verificationData,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to save World ID verification:', error);
  }
}

/**
 * Clear World ID verification from localStorage
 */
export function clearWorldIDVerification() {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('worldid_verification');
  } catch (error) {
    console.error('Failed to clear World ID verification:', error);
  }
}

/**
 * World ID verification levels
 */
export const VERIFICATION_LEVELS = {
  ORB: 'orb',           // Highest level - biometric verification
  DEVICE: 'device',     // Device-based verification
  NONE: 'none'          // No verification
};

/**
 * Check if user should see high-value features
 * @param {string|null} verificationLevel
 * @returns {boolean}
 */
export function canAccessHighValueFeatures(verificationLevel) {
  return verificationLevel === VERIFICATION_LEVELS.ORB || 
         verificationLevel === VERIFICATION_LEVELS.DEVICE;
}

/**
 * Get verification badge color based on level
 * @param {string|null} level
 * @returns {string} CSS color value
 */
export function getVerificationBadgeColor(level) {
  switch (level) {
    case VERIFICATION_LEVELS.ORB:
      return '#10B981'; // Green for Orb verification
    case VERIFICATION_LEVELS.DEVICE:
      return '#06B6D4'; // Cyan for device verification
    default:
      return '#64748B'; // Slate for no verification
  }
}

/**
 * Get verification badge text
 * @param {string|null} level
 * @returns {string}
 */
export function getVerificationBadgeText(level) {
  switch (level) {
    case VERIFICATION_LEVELS.ORB:
      return 'Verified Human (Orb)';
    case VERIFICATION_LEVELS.DEVICE:
      return 'Verified Device';
    default:
      return 'Not Verified';
  }
}

/**
 * Mock verification for development (when World ID is not available)
 * @returns {Promise<{success: boolean, mock: boolean}>}
 */
export async function mockWorldIDVerification() {
  // Simulate verification delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: true,
    mock: true,
    nullifier_hash: 'mock_' + Math.random().toString(36).substring(7),
    verification_level: VERIFICATION_LEVELS.DEVICE,
    timestamp: Date.now()
  };
}
