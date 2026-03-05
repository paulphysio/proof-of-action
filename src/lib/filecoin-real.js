import { Synapse } from '@filoz/synapse-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { parseUnits, formatUnits } from 'viem';

/**
 * Real Filecoin Storage Implementation using Synapse SDK
 * Replaces mock implementation with production-ready decentralized storage
 */

// Initialize Synapse SDK
let synapse = null;
let isInitialized = false;

/**
 * Initialize Synapse SDK with private key from environment
 */
async function initializeSynapse() {
  if (isInitialized) return synapse;

  try {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not found in environment variables');
    }

    console.log('Initializing Filecoin Synapse SDK...');
    
    synapse = Synapse.create({
      account: privateKeyToAccount(privateKey),
      // Add custom RPC configuration for better reliability
      rpc: process.env.FILECOIN_RPC_URL || 'https://api.calibration.node.glif.io/rpc/v1'
    });

    isInitialized = true;
    console.log('✅ Filecoin Synapse SDK initialized successfully');
    return synapse;
  } catch (error) {
    console.error('❌ Failed to initialize Filecoin Synapse SDK:', error);
    
    // Don't throw error, return null to allow graceful fallback
    synapse = null;
    isInitialized = false;
    return null;
  }
}

/**
 * Setup payment account with USDFC tokens
 */
async function setupPayment() {
  try {
    const sdk = await initializeSynapse();
    
    if (!sdk) {
      console.warn('⚠️ Filecoin SDK not available, skipping payment setup');
      return { success: false, error: 'SDK initialization failed' };
    }
    
    // Check current USDFC balance
    const walletBalance = await sdk.payments.walletBalance({ token: 'USDFC' });
    const formattedBalance = formatUnits(walletBalance);
    console.log(`Current USDFC balance: ${formattedBalance}`);

    // Deposit USDFC for payment and approve Warm Storage service
    // Deposit amount: 2.5 USDFC (covers 1TiB of storage for 30 days)
    const hash = await sdk.payments.depositWithPermitAndApproveOperator({
      amount: parseUnits('2.5'), // 2.5 USDFC
    });

    await sdk.client.waitForTransactionReceipt({ hash });
    console.log('✅ USDFC deposit and Warm Storage service approval successful!');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Payment setup failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Store data on Filecoin using Synapse SDK
 * @param {Object} data - Data to store (verification proofs, reputation, etc.)
 * @param {Object} options - Storage options
 * @returns {Promise<Object>} Storage result with pieceCid
 */
export async function storeDataOnFilecoin(data, options = {}) {
  try {
    const sdk = await initializeSynapse();
    
    if (!sdk) {
      console.warn('⚠️ Filecoin SDK not available, using fallback storage');
      return {
        success: false,
        error: 'Filecoin network unavailable',
        pieceCid: null,
        fallbackMode: true
      };
    }
    
    // Ensure payment is set up
    const paymentResult = await setupPayment();
    if (!paymentResult.success) {
      console.warn('⚠️ Payment setup failed, continuing with storage attempt');
    }

    // Convert data to JSON string then to Uint8Array
    const jsonString = JSON.stringify(data, null, 2);
    const file = new TextEncoder().encode(jsonString);

    // Ensure minimum size requirement of 127 bytes
    if (file.length < 127) {
      // Pad with spaces to meet minimum requirement
      const padding = ' '.repeat(127 - file.length);
      const paddedFile = new TextEncoder().encode(jsonString + padding);
      
      console.log(`Data padded from ${file.length} to ${paddedFile.length} bytes to meet minimum requirement`);
      
      // Upload with default options (2 copies for durability)
      const { pieceCid, copies, failures } = await sdk.storage.upload(paddedFile, {
        metadata: {
          category: options.category || 'emergency-response',
          type: options.type || 'verification-proof',
          timestamp: new Date().toISOString(),
          ...options.metadata
        }
      });

      console.log(`✅ Data stored on ${copies.length} providers`);
      if (failures.length > 0) {
        console.warn(`⚠️ ${failures.length} copy attempt(s) failed`);
      }

      return {
        success: true,
        pieceCid: pieceCid.toString(),
        copies: copies.length,
        failures: failures.length,
        size: paddedFile.length,
        metadata: options.metadata || {}
      };
    } else {
      // Upload without padding
      const { pieceCid, copies, failures } = await sdk.storage.upload(file, {
        metadata: {
          category: options.category || 'emergency-response',
          type: options.type || 'verification-proof',
          timestamp: new Date().toISOString(),
          ...options.metadata
        }
      });

      console.log(`✅ Data stored on ${copies.length} providers`);
      if (failures.length > 0) {
        console.warn(`⚠️ ${failures.length} copy attempt(s) failed`);
      }

      return {
        success: true,
        pieceCid: pieceCid.toString(),
        copies: copies.length,
        failures: failures.length,
        size: file.length,
        metadata: options.metadata || {}
      };
    }
  } catch (error) {
    console.error('❌ Failed to store data on Filecoin:', error);
    return {
      success: false,
      error: error.message,
      pieceCid: null
    };
  }
}

/**
 * Retrieve data from Filecoin using Synapse SDK
 * @param {string} pieceCid - Content ID of the stored data
 * @returns {Promise<Object>} Retrieved data
 */
export async function retrieveDataFromFilecoin(pieceCid) {
  try {
    const sdk = await initializeSynapse();
    
    console.log(`📥 Retrieving data from Filecoin (pieceCid: ${pieceCid})`);
    
    // Download data from Filecoin
    const downloadedData = await sdk.storage.download({ pieceCid });
    
    // Convert Uint8Array back to string
    const decodedText = new TextDecoder().decode(downloadedData);
    
    // Parse JSON (remove padding if present)
    let jsonData;
    try {
      jsonData = JSON.parse(decodedText.trim());
    } catch (parseError) {
      // If parsing fails, try to remove padding and parse again
      const trimmedText = decodedText.replace(/\s+$/, '');
      jsonData = JSON.parse(trimmedText);
    }
    
    console.log(`✅ Successfully retrieved data from Filecoin`);
    
    return {
      success: true,
      data: jsonData,
      size: downloadedData.length
    };
  } catch (error) {
    console.error('❌ Failed to retrieve data from Filecoin:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * Store World ID verification proof on Filecoin
 * @param {string} walletAddress - User's wallet address
 * @param {Object} verificationData - World ID verification data
 * @returns {Promise<Object>} Storage result
 */
export async function storeWorldIDVerificationOnFilecoin(walletAddress, verificationData) {
  return await storeDataOnFilecoin(verificationData, {
    category: 'world-id-verification',
    type: 'humanity-proof',
    walletAddress,
    metadata: {
      verificationLevel: verificationData.verification_level,
      nullifierHash: verificationData.nullifier_hash,
      timestamp: verificationData.timestamp || new Date().toISOString()
    }
  });
}

/**
 * Store emergency response data on Filecoin
 * @param {Object} responseData - Emergency response data
 * @returns {Promise<Object>} Storage result
 */
export async function storeEmergencyResponseOnFilecoin(responseData) {
  return await storeDataOnFilecoin(responseData, {
    category: 'emergency-response',
    type: 'action-proof',
    metadata: {
      requestId: responseData.requestId,
      responderWallet: responseData.responder_wallet,
      location: responseData.location,
      timestamp: responseData.timestamp || new Date().toISOString()
    }
  });
}

/**
 * Store reputation data on Filecoin
 * @param {string} walletAddress - User's wallet address
 * @param {Object} reputationData - Reputation data
 * @returns {Promise<Object>} Storage result
 */
export async function storeReputationOnFilecoin(walletAddress, reputationData) {
  return await storeDataOnFilecoin(reputationData, {
    category: 'reputation',
    type: 'user-reputation',
    walletAddress,
    metadata: {
      score: reputationData.score,
      level: reputationData.level,
      timestamp: reputationData.timestamp || new Date().toISOString()
    }
  });
}

/**
 * Get Filecoin storage status and balance
 * @returns {Promise<Object>} Storage status
 */
export async function getFilecoinStorageStatus() {
  try {
    const sdk = await initializeSynapse();
    
    if (!sdk) {
      return {
        success: false,
        error: 'Filecoin network unavailable',
        balance: '0',
        initialized: false,
        network: 'calibration'
      };
    }
    
    // Get USDFC balance
    const walletBalance = await sdk.payments.walletBalance({ token: 'USDFC' });
    const formattedBalance = formatUnits(walletBalance);
    
    return {
      success: true,
      balance: formattedBalance,
      balanceRaw: walletBalance.toString(),
      initialized: isInitialized,
      network: 'calibration'
    };
  } catch (error) {
    console.error('❌ Failed to get Filecoin status:', error);
    return {
      success: false,
      error: error.message,
      balance: '0',
      initialized: false,
      network: 'calibration'
    };
  }
}

/**
 * Create storage context with specific provider and CDN
 * @param {Object} options - Context options
 * @returns {Promise<Object>} Storage context
 */
export async function createFilecoinStorageContext(options = {}) {
  try {
    const sdk = await initializeSynapse();
    
    const context = await sdk.storage.createContext({
      providerId: options.providerId || 1n, // Use specific provider
      withCDN: options.withCDN !== false, // Enable CDN for faster retrieval
      metadata: {
        category: options.category || 'emergency-response',
        version: options.version || '1.0',
        ...options.metadata
      }
    });

    console.log('✅ Filecoin storage context created with CDN');
    return {
      success: true,
      context,
      providerId: options.providerId || 1n,
      withCDN: options.withCDN !== false
    };
  } catch (error) {
    console.error('❌ Failed to create storage context:', error);
    return {
      success: false,
      error: error.message,
      context: null
    };
  }
}

// Export the initialized SDK for advanced usage
export { synapse, initializeSynapse };
