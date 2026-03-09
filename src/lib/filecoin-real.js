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

    console.log('🔗 Initializing Filecoin Synapse SDK...');
    console.log('🌐 Network:', process.env.FILECOIN_NETWORK || 'calibration');
    console.log('🔌 RPC URL:', process.env.FILECOIN_RPC_URL || 'default');
    
    // Test network connectivity first
    const rpcUrl = process.env.FILECOIN_RPC_URL || 'https://api.calibration.node.glif.io/rpc/v1';
    console.log('🔍 Testing Filecoin network connectivity...');
    
    const connectivityTest = await testNetworkConnectivity(rpcUrl);
    if (!connectivityTest) {
      throw new Error('Filecoin network is not reachable. Please check your internet connection or RPC URL.');
    }
    
    synapse = Synapse.create({
      account: privateKeyToAccount(privateKey),
      rpc: rpcUrl
    });

    isInitialized = true;
    console.log('✅ Filecoin Synapse SDK initialized successfully');
    return synapse;
  } catch (error) {
    console.error('❌ Failed to initialize Filecoin Synapse SDK:', error);
    console.log('🔄 Falling back to mock storage mode');
    
    // Don't throw error, return null to allow graceful fallback
    synapse = null;
    isInitialized = false;
    return null;
  }
}

/**
 * Test network connectivity to Filecoin RPC
 */
async function testNetworkConnectivity(rpcUrl) {
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      }),
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Filecoin network reachable:', data);
      return true;
    } else {
      console.warn('⚠️ Filecoin network responded with error:', response.status);
      return false;
    }
  } catch (error) {
    console.warn('⚠️ Filecoin network connectivity test failed:', error.message);
    return false;
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
 * Store data on Filecoin with fallback to mock storage
 * @param {Object} data - Data to store (verification proofs, reputation, etc.)
 * @param {Object} options - Storage options
 * @returns {Promise<Object>} Storage result
 */
export async function storeDataOnFilecoin(data, options = {}) {
  try {
    // Try real Filecoin storage first
    const result = await storeOnRealFilecoin(data, options);
    if (result.success) {
      return result;
    }
  } catch (error) {
    console.warn('⚠️ Real Filecoin storage failed, trying fallback:', error.message);
  }

  // Fallback to mock storage
  console.log('🔄 Using mock Filecoin storage as fallback');
  return await storeOnMockFilecoin(data, options);
}

/**
 * Store data on real Filecoin network with advanced Synapse SDK features
 */
async function storeOnRealFilecoin(data, options) {
  const sdk = await initializeSynapse();
  
  if (!sdk) {
    throw new Error('Filecoin network unavailable');
  }

  try {
    console.log(`📤 Storing data on Filecoin (${options.category || 'data'})...`);
    
    // Convert data to JSON string then to Uint8Array
    const jsonString = JSON.stringify(data, null, 2);
    const file = new TextEncoder().encode(jsonString);

    // Ensure minimum size requirement of 127 bytes
    if (file.length < 127) {
      // Pad with meaningful content to meet minimum requirement
      const padding = `
        
        === FILECOIN ONCHAIN CLOUD ===
        Data Category: ${options.category || 'agent-data'}
        Timestamp: ${new Date().toISOString()}
        Network: calibration
        Purpose: Agent Reputation & Portable Identity
        Challenge: Filecoin Agent Reputation System
        ==================================
      `;
      const paddedContent = jsonString + padding;
      const paddedFile = new TextEncoder().encode(paddedContent);
      
      console.log(`📊 Original size: ${file.length} bytes, Padded size: ${paddedFile.length} bytes`);
      
      // Create storage context with advanced features
      const context = await sdk.storage.createContext({
        withCDN: true, // Enable Filecoin Beam for faster retrieval
        metadata: {
          category: options.category || 'agent-data',
          type: options.type || 'identity-proof',
          network: 'calibration',
          challenge: 'agent-reputation-portable-identity',
          timestamp: new Date().toISOString(),
          ...options.metadata
        }
      });

      // Upload to context with advanced features
      const storageResult = await context.upload(paddedFile);
      
      if (!storageResult || !storageResult.pieceCid) {
        throw new Error('Storage operation failed');
      }

      console.log(`✅ Data stored on Filecoin with CDN enabled (pieceCid: ${storageResult.pieceCid})`);
      console.log(`📦 Stored on ${storageResult.copies?.length || 1} providers`);
      
      if (storageResult.failures?.length > 0) {
        console.warn(`⚠️ ${storageResult.failures.length} copy attempt(s) failed`);
      }

      // Store reference in local storage for UI
      const storageRef = {
        pieceCid: storageResult.pieceCid,
        network: 'filecoin_calibration',
        timestamp: new Date().toISOString(),
        type: options.type || 'data',
        category: options.category || 'data',
        size: paddedFile.length,
        copies: storageResult.copies?.length || 1,
        failures: storageResult.failures?.length || 0,
        withCDN: true,
        metadata: {
          category: options.category || 'agent-data',
          type: options.type || 'identity-proof',
          network: 'calibration',
          challenge: 'agent-reputation-portable-identity',
          ...options.metadata
        }
      };

      saveStorageReference(storageRef);

      return {
        success: true,
        pieceCid: storageResult.pieceCid,
        copies: storageResult.copies?.length || 1,
        failures: storageResult.failures?.length || 0,
        size: paddedFile.length,
        withCDN: true,
        metadata: storageRef.metadata
      };
    } else {
      // For files already meeting minimum size, use standard upload
      const storageResult = await sdk.storage.upload(file, {
        metadata: {
          category: options.category || 'agent-data',
          type: options.type || 'identity-proof',
          network: 'calibration',
          challenge: 'agent-reputation-portable-identity',
          timestamp: new Date().toISOString(),
          ...options.metadata
        }
      });

      if (!storageResult || !storageResult.pieceCid) {
        throw new Error('Storage operation failed');
      }

      console.log(`✅ Data stored on Filecoin (pieceCid: ${storageResult.pieceCid})`);
      console.log(`📦 Stored on ${storageResult.copies?.length || 1} providers`);
      
      if (storageResult.failures?.length > 0) {
        console.warn(`⚠️ ${storageResult.failures.length} copy attempt(s) failed`);
      }

      // Store reference in local storage for UI
      const storageRef = {
        pieceCid: storageResult.pieceCid,
        network: 'filecoin_calibration',
        timestamp: new Date().toISOString(),
        type: options.type || 'data',
        category: options.category || 'data',
        size: file.length,
        copies: storageResult.copies?.length || 1,
        failures: storageResult.failures?.length || 0,
        metadata: {
          category: options.category || 'agent-data',
          type: options.type || 'identity-proof',
          network: 'calibration',
          challenge: 'agent-reputation-portable-identity',
          ...options.metadata
        }
      };

      saveStorageReference(storageRef);

      return {
        success: true,
        pieceCid: storageResult.pieceCid,
        copies: storageResult.copies?.length || 1,
        failures: storageResult.failures?.length || 0,
        size: file.length,
        metadata: storageRef.metadata
      };
    }
  } catch (error) {
    console.error('❌ Failed to store data on Filecoin:', error);
    throw error;
  }
}

/**
 * Mock Filecoin storage for development/fallback
 */
async function storeOnMockFilecoin(data, options) {
  console.log('🧪 Using mock Filecoin storage');
  
  // Generate mock CID
  const mockCid = generateMockCID();
  
  // Simulate storage delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Store reference in local storage
  const storageRef = {
    pieceCid: mockCid,
    network: 'mock_filecoin',
    timestamp: new Date().toISOString(),
    type: options.type || 'data',
    category: options.category || 'data',
    size: JSON.stringify(data).length,
    metadata: options.metadata || {},
    mock: true
  };

  saveStorageReference(storageRef);

  return {
    success: true,
    pieceCid: mockCid,
    copies: 1,
    failures: 0,
    size: JSON.stringify(data).length,
    metadata: options.metadata || {},
    mock: true
  };
}

/**
 * Generate mock CID for testing
 */
function generateMockCID() {
  const chars = '0123456789abcdef';
  let cid = 'bafybei';
  for (let i = 0; i < 44; i++) {
    cid += chars[Math.floor(Math.random() * chars.length)];
  }
  return cid;
}

/**
 * Save storage reference to localStorage for UI display
 */
function saveStorageReference(storageRef) {
  if (typeof window !== 'undefined') {
    try {
      const existing = JSON.parse(localStorage.getItem('filecoin_storage') || '[]');
      existing.unshift(storageRef); // Add to beginning
      localStorage.setItem('filecoin_storage', JSON.stringify(existing));
      console.log('💾 Storage reference saved to localStorage');
    } catch (error) {
      console.warn('Failed to save storage reference:', error);
    }
  }
}

/**
 * Retrieve data from Filecoin using Synapse SDK
 * @param {string} pieceCid - Content ID of the stored data
 * @returns {Promise<Object>} Retrieved data
 */
export async function retrieveDataFromFilecoin(pieceCid) {
  try {
    // Try real Filecoin retrieval first
    const result = await retrieveFromRealFilecoin(pieceCid);
    if (result.success) {
      return result;
    }
  } catch (error) {
    console.warn('⚠️ Real Filecoin retrieval failed, trying fallback:', error.message);
  }

  // Fallback to mock retrieval
  console.log('🔄 Using mock Filecoin retrieval as fallback');
  return await retrieveFromMockFilecoin(pieceCid);
}

/**
 * Get available storage providers
 */
export async function getStorageProviders() {
  try {
    const sdk = await initializeSynapse();
    
    if (!sdk) {
      console.warn('⚠️ Filecoin SDK not available - using mock providers');
      // Return mock providers for development
      return [
        {
          id: 1,
          name: 'Mock Provider Alpha',
          description: 'Development storage provider',
          isActive: true,
          serviceProvider: '0x1234567890123456789012345678901234567890',
          pdp: { serviceURL: 'https://mock-provider.example.com' }
        },
        {
          id: 2,
          name: 'Mock Provider Beta',
          description: 'Development storage provider',
          isActive: true,
          serviceProvider: '0x0987654321098765432109876543210987654321',
          pdp: { serviceURL: 'https://mock-provider-beta.example.com' }
        }
      ];
    }

    const storageInfo = await sdk.storage.getStorageInfo();
    const providers = storageInfo.providers;

    console.log("📋 Available Filecoin providers:");
    providers.forEach((provider) => {
      console.table({
        ID: provider.id,
        Name: provider.name,
        Description: provider.description,
        Active: provider.isActive,
        ProviderAddress: provider.serviceProvider,
        PDPServiceURL: provider.pdp.serviceURL,
      });
    });

    return providers;
  } catch (error) {
    console.error('❌ Failed to get storage providers:', error);
    // Return empty array on error to prevent UI crashes
    return [];
  }
}

/**
 * Retrieve data from real Filecoin network with enhanced features
 */
async function retrieveFromRealFilecoin(pieceCid) {
  const sdk = await initializeSynapse();
  
  if (!sdk) {
    throw new Error('Filecoin network unavailable');
  }
  
  console.log(`📥 Retrieving data from Filecoin (pieceCid: ${pieceCid})`);
  
  try {
    // Download data from Filecoin
    const downloadedData = await sdk.storage.download({ pieceCid });
    
    // Convert Uint8Array back to string
    const decodedText = new TextDecoder().decode(downloadedData);
    
    // Parse JSON (remove padding if present)
    let jsonData;
    try {
      jsonData = JSON.parse(decodedText.trim());
    } catch (parseError) {
      // If parsing fails, try to extract JSON from padded content
      const jsonStart = decodedText.indexOf('{');
      const jsonEnd = decodedText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonOnly = decodedText.substring(jsonStart, jsonEnd + 1);
        jsonData = JSON.parse(jsonOnly);
      } else {
        throw new Error('Could not parse JSON from retrieved data');
      }
    }
    
    console.log(`✅ Successfully retrieved data from Filecoin (${downloadedData.length} bytes)`);
    
    return {
      success: true,
      data: jsonData,
      size: downloadedData.length
    };
  } catch (error) {
    console.error('❌ Failed to retrieve data from Filecoin:', error);
    throw error;
  }
}

/**
 * Retrieve data from mock storage
 */
async function retrieveFromMockFilecoin(pieceCid) {
  console.log('🧪 Using mock Filecoin retrieval');
  
  // Look up the stored data from localStorage
  if (typeof window !== 'undefined') {
    try {
      const existing = JSON.parse(localStorage.getItem('filecoin_storage') || '[]');
      const storageRef = existing.find(ref => ref.pieceCid === pieceCid);
      
      if (storageRef && storageRef.mock) {
        // For mock data, we can't retrieve the actual stored content
        // So we return a mock response
        return {
          success: true,
          data: {
            type: 'mock_retrieval',
            pieceCid: pieceCid,
            timestamp: storageRef.timestamp,
            message: 'This is mock data retrieval - original content not stored in mock mode',
            category: storageRef.category,
            metadata: storageRef.metadata
          },
          size: storageRef.size,
          mock: true
        };
      }
    } catch (error) {
      console.warn('Failed to retrieve mock data:', error);
    }
  }
  
  return {
    success: false,
    error: 'Mock data not found for this CID',
    data: null
  };
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
