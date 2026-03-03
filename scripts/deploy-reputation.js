import hre from 'hardhat';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Deploy Proof of Action Reputation Contract to World Chain
 * 
 * Prerequisites:
 * 1. Set WORLD_CHAIN_RPC_URL in .env
 * 2. Set PRIVATE_KEY in .env (with tETH for gas)
 * 3. Run: npx hardhat run scripts/deploy-reputation.js --network worldchain
 */

async function main() {
  console.log("🚀 Deploying Proof of Action Reputation Contract to World Chain...\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy the contract
  const ProofOfActionReputation = await hre.ethers.getContractFactory("ProofOfActionReputation");
  const reputation = await ProofOfActionReputation.deploy();

  const deploymentTx = reputation.deploymentTransaction();
  await deploymentTx.wait();

  console.log("✅ Contract deployed to:", await reputation.getAddress());
  console.log("📦 Transaction hash:", deploymentTx.hash);
  console.log("⛽ Gas used:", deploymentTx.gasLimit.toString());
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: await reputation.getAddress(),
    deployerAddress: deployer.address,
    transactionHash: deploymentTx.hash,
    blockNumber: deploymentTx.blockNumber,
    timestamp: new Date().toISOString(),
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId
  };

  // Save to file
  const deploymentPath = path.join(__dirname, '../deployment-worldchain.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, (key, value) => {
    if (typeof value === 'bigint') return value.toString();
    return value;
  }, 2));
  console.log("\n💾 Deployment info saved to:", deploymentPath);

  // Verify on World Chain explorer (if supported)
  console.log("\n🔍 Explorer URL:");
  console.log(`https://worldchain-sepolia.explorer.alchemy.com/address/${await reputation.getAddress()}`);

  // Set up initial authorized verifiers
  console.log("\n⚙️ Setting up authorized verifiers...");
  
  // Add the AI verification system as a verifier
  // In production, this would be your backend wallet
  await (await reputation.setVerifier(deployer.address, true)).wait();
  console.log("✅ Deployer set as authorized verifier");

  console.log("\n🎉 Deployment complete!");
  console.log("\nNext steps:");
  console.log("1. Save the contract address in your .env file:");
  console.log(`   NEXT_PUBLIC_WORLD_CHAIN_CONTRACT=${await reputation.getAddress()}`);
  console.log("2. Fund your contract with tETH for gas");
  console.log("3. Set up additional verifiers as needed");
  console.log("4. Update your frontend to use the deployed contract");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
