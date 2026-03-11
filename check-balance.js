// Filecoin balance checker script
import { execSync } from 'child_process';

async function checkBalances() {
  try {
    console.log('🔍 Checking Filecoin balances...\n');
    
    // 1. Check tFIL balance using curl
    const curlCommand = `curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xD410eF12B007Bbcf452767d0dD858E6fC29A4fA5", "latest"],"id":1}' https://api.calibration.node.glif.io/rpc/v1`;
    
    try {
      const result = execSync(curlCommand, { encoding: 'utf8' });
      const balanceHex = JSON.parse(result).result;
      
      if (balanceHex) {
        const balanceDecimal = parseInt(balanceHex, 16);
        const tfilBalance = balanceDecimal / 1000000000000000000;
        
        console.log(`� tFIL Balance: ${tfilBalance.toFixed(6)} tFIL`);
        
        // 2. Storage cost analysis
        const storageCostPerDeal = 1.06; // tFIL (from your error logs)
        const availableForStorage = tfilBalance - storageCostPerDeal;
        
        console.log('\n📊 Storage Analysis:');
        console.log(`💸 Cost per storage deal: ${storageCostPerDeal} tFIL`);
        console.log(`📦 Available for storage: ${availableForStorage.toFixed(6)} tFIL`);
        console.log(`🎯 Can store: ${Math.floor(availableForStorage / storageCostPerDeal)} more deals`);
        
        // 3. Recommendations
        console.log('\n💡 Recommendations:');
        if (tfilBalance < storageCostPerDeal) {
          console.log('❌ Insufficient tFIL for storage');
          console.log('💰 Get more tFIL from: https://faucet.calibration.fildev.network/');
          console.log(`🎯 You need ${(storageCostPerDeal - tfilBalance).toFixed(6)} more tFIL`);
        } else {
          console.log('✅ Sufficient tFIL for storage operations');
          console.log(`🚀 You can store ${Math.floor(availableForStorage / storageCostPerDeal)} more emergency responses`);
        }
        
        // 4. USDFC info (for your reference)
        console.log('\n💵 USDFC Information:');
        console.log('📝 USDFC is a stablecoin on Filecoin but NOT required for your current storage');
        console.log('🔧 Your system uses tFIL directly for storage payments');
        console.log('💡 USDFC would be useful for: DeFi operations, stable payments, advanced contracts');
        
      } else {
        console.log('❌ Could not retrieve balance');
      }
    } catch (error) {
      console.error('❌ Error checking tFIL balance:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error in balance checker:', error.message);
  }
}

// Run the check
checkBalances();
