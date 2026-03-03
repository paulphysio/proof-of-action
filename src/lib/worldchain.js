/**
 * World Chain Contract Interaction
 * 
 * Handles interactions with the ProofOfActionReputation SBT contract
 * on World Chain for gas-free reputation and soulbound tokens
 */

import { ethers } from 'ethers';

const CONTRACT_ABI = [
  // View functions
  "function humanTokenId(address) view returns (uint256)",
  "function reputationData(uint256) view returns (uint256 proofPoints, uint256 verifiedActions, uint256 lastUpdated, string[] skillBadges, string metadataURI)",
  "function isWorldIDVerified(uint256) view returns (bool)",
  "function authorizedVerifiers(address) view returns (bool)",
  "function getReputation(address) view returns (uint256 tokenId, uint256 proofPoints, uint256 verifiedActions, bool worldIDVerified, string[] skillBadges, uint256 lastUpdated)",
  
  // Write functions
  "function registerHuman(address human, bool worldIDVerified) returns (uint256)",
  "function awardProofPoints(address human, uint256 points, string reason, uint256 actionId, uint256 confidenceScore)",
  "function awardSkillBadge(address human, string badgeName)",
  "function updateWorldIDVerification(address human, bool verified)",
  
  // Events
  "event HumanRegistered(address indexed human, uint256 tokenId, bool worldIDVerified)",
  "event ProofPointsAwarded(address indexed human, uint256 amount, string reason)",
  "event SkillBadgeEarned(address indexed human, string badgeName)",
  "event ActionVerified(address indexed human, uint256 actionId, uint256 confidenceScore)"
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_WORLD_CHAIN_CONTRACT;

/**
 * Get World Chain provider
 */
export function getWorldChainProvider() {
  if (!window.ethereum) {
    throw new Error('No Ethereum provider found. Install MetaMask or use World App.');
  }
  return new ethers.providers.Web3Provider(window.ethereum);
}

/**
 * Get contract instance (read-only)
 */
export function getReputationContract() {
  const provider = getWorldChainProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

/**
 * Get contract instance with signer
 */
export async function getReputationContractWithSigner() {
  const provider = getWorldChainProvider();
  await provider.send('eth_requestAccounts', []);
  const signer = provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/**
 * Register a new human on World Chain
 */
export async function registerHumanOnWorldChain(walletAddress, worldIDVerified) {
  try {
    const contract = await getReputationContractWithSigner();
    const tx = await contract.registerHuman(walletAddress, worldIDVerified);
    const receipt = await tx.wait();
    
    // Parse event to get token ID
    const event = receipt.events.find(e => e.event === 'HumanRegistered');
    const tokenId = event?.args?.tokenId;
    
    return {
      success: true,
      tokenId: tokenId?.toString(),
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Award proof points to a human
 */
export async function awardProofPointsOnChain(
  walletAddress, 
  points, 
  reason, 
  actionId, 
  confidenceScore
) {
  try {
    const contract = await getReputationContractWithSigner();
    const tx = await contract.awardProofPoints(
      walletAddress,
      points,
      reason,
      actionId,
      confidenceScore
    );
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  } catch (error) {
    console.error('Award points error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get reputation data for a human
 */
export async function getReputationOnChain(walletAddress) {
  try {
    const contract = getReputationContract();
    const data = await contract.getReputation(walletAddress);
    
    return {
      success: true,
      tokenId: data.tokenId.toString(),
      proofPoints: data.proofPoints.toString(),
      verifiedActions: data.verifiedActions.toString(),
      worldIDVerified: data.worldIDVerified,
      skillBadges: data.skillBadges,
      lastUpdated: new Date(data.lastUpdated.toNumber() * 1000).toISOString()
    };
  } catch (error) {
    console.error('Get reputation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if human is registered
 */
export async function isRegisteredOnChain(walletAddress) {
  try {
    const contract = getReputationContract();
    const tokenId = await contract.humanTokenId(walletAddress);
    return tokenId.toString() !== '0';
  } catch (error) {
    return false;
  }
}

/**
 * Award a skill badge
 */
export async function awardSkillBadge(walletAddress, badgeName) {
  try {
    const contract = await getReputationContractWithSigner();
    const tx = await contract.awardSkillBadge(walletAddress, badgeName);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.transactionHash
    };
  } catch (error) {
    console.error('Award badge error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Switch to World Chain network
 */
export async function switchToWorldChain() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x1E0' }], // 480 in hex
    });
    return { success: true };
  } catch (switchError) {
    // If network doesn't exist, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x1E0',
            chainName: 'World Chain',
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://worldchain-mainnet.g.alchemy.com/public'],
            blockExplorerUrls: ['https://worldchain-mainnet.explorer.alchemy.com']
          }]
        });
        return { success: true };
      } catch (addError) {
        return { success: false, error: addError.message };
      }
    }
    return { success: false, error: switchError.message };
  }
}

export default {
  registerHumanOnWorldChain,
  awardProofPointsOnChain,
  getReputationOnChain,
  isRegisteredOnChain,
  awardSkillBadge,
  switchToWorldChain,
  getWorldChainProvider,
  getReputationContract
};
