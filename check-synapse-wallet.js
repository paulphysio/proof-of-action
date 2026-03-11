// Check what wallet address Synapse SDK is actually using
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// From your .env.local
const PRIVATE_KEY = '0x885d2b56615cc5d1ecee03d2459e99768a16a43a616e481b49b8fefd64b50f03';

// Derive the actual wallet address from the private key
const account = privateKeyToAccount(PRIVATE_KEY);

console.log('🔍 Synapse SDK Wallet Analysis:');
console.log('================================');
console.log(`🔐 Private Key: ${PRIVATE_KEY}`);
console.log(`👛 Synapse SDK Wallet Address: ${account.address}`);
console.log(`📍 Address You've Been Checking: 0xD410eF12B007Bbcf452767d0dD858E6fC29A4fA5`);
console.log(`🔄 Addresses Match: ${account.address.toLowerCase() === '0xD410eF12B007Bbcf452767d0dD858E6fC29A4fA5'.toLowerCase() ? 'YES' : 'NO'}`);

if (account.address.toLowerCase() !== '0xD410eF12B007Bbcf452767d0dD858E6fC29A4fA5'.toLowerCase()) {
  console.log('\n❌ WALLET MISMATCH DETECTED!');
  console.log('🔧 This explains the insufficient funds error.');
  console.log('💡 The Synapse SDK is using a different wallet than the one you funded.');
  console.log('\n🎯 SOLUTIONS:');
  console.log('1. Fund the correct wallet address:', account.address);
  console.log('2. OR update PRIVATE_KEY in .env.local to match your funded wallet');
} else {
  console.log('\n✅ Wallet addresses match - issue might be something else');
}
