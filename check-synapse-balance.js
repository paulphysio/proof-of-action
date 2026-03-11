// Check Synapse SDK wallet balance using the same method
import { execSync } from 'child_process';

// The actual wallet address Synapse SDK uses
const SYNAPSE_WALLET = '0xD410eF12B007Bbcf452767d0dD858E6fC29A4fA5';

async function checkSynapseBalance() {
  try {
    console.log('🔍 Checking Synapse SDK Wallet Balance...\n');
    
    // Check balance using the same RPC as Synapse SDK
    const curlCommand = `curl.exe -s -X POST -H "Content-Type: application/json" -d "{\\"jsonrpc\\":\\"2.0\\",\\"method\\":\\"eth_getBalance\\",\\"params\\":[\\"${SYNAPSE_WALLET}\\", \\"latest\\"],\\"id\\":1}" https://api.calibration.node.glif.io/rpc/v1`;
    
    try {
      const result = execSync(curlCommand, { encoding: 'utf8' });
      const data = JSON.parse(result);
      
      if (data.result) {
        const balanceHex = data.result;
        const balanceDecimal = parseInt(balanceHex, 16);
        const tfilBalance = balanceDecimal / 1000000000000000000;
        
        console.log(`💰 Synapse SDK Wallet Balance: ${tfilBalance.toFixed(6)} tFIL`);
        console.log(`📍 Wallet Address: ${SYNAPSE_WALLET}`);
        
        // Compare with error message
        const errorAvailable = 16252083333962957 / 1000000000000000000;
        console.log(`\n📊 Balance Analysis:`);
        console.log(`💸 Current Balance: ${tfilBalance.toFixed(6)} tFIL`);
        console.log(`❌ Error Shows: ${errorAvailable.toFixed(6)} tFIL`);
        console.log(`🔄 Difference: ${(tfilBalance - errorAvailable).toFixed(6)} tFIL`);
        
        // Check if balance changed recently
        if (Math.abs(tfilBalance - errorAvailable) > 0.001) {
          console.log(`\n🔄 BALANCE CHANGED!`);
          console.log(`💡 The error might be from an older state`);
          console.log(`🎯 Try your app again - it might work now!`);
        } else {
          console.log(`\n❌ Balance matches error - still insufficient`);
          console.log(`💰 Required: 1.06 tFIL`);
          console.log(`🎯 Shortfall: ${(1.06 - tfilBalance).toFixed(6)} tFIL`);
        }
        
        // Check recent transactions
        console.log(`\n🔍 Checking for recent transactions...`);
        const txCommand = `curl.exe -s -X POST -H "Content-Type: application/json" -d "{\\"jsonrpc\\":\\"2.0\\",\\"method\\":\\"eth_getTransactionCount\\",\\"params\\":[\\"${SYNAPSE_WALLET}\\", \\"latest\\"],\\"id\\":1}" https://api.calibration.node.glif.io/rpc/v1`;
        
        try {
          const txResult = execSync(txCommand, { encoding: 'utf8' });
          const txData = JSON.parse(txResult);
          const nonce = parseInt(txData.result, 16);
          console.log(`📝 Transaction Count (Nonce): ${nonce}`);
          
          if (nonce > 0) {
            console.log(`🔄 Recent transactions detected - funds might be locked`);
          }
        } catch (txError) {
          console.log(`❌ Could not check transaction count`);
        }
        
      } else {
        console.log('❌ Could not retrieve balance');
      }
    } catch (error) {
      console.error('❌ Error checking balance:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error in balance checker:', error.message);
  }
}

// Run the check
checkSynapseBalance();
