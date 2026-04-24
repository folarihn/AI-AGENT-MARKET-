import { ethers } from "ethers";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";

const ESCROW_ABI = [
  {
    name: 'setOperator',
    type: 'function',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'status', type: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

async function main() {
  const escrowAddress = process.env.AGENTI_SKILL_ESCROW_CONTRACT;
  const operatorAddress = process.env.PLATFORM_WALLET_ADDRESS;
  const rpcUrl = process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network";
  const privateKey = process.env.ACCOUNT_PRIVATE_KEY || process.env.PLATFORM_PRIVATE_KEY;

  if (!escrowAddress) {
    console.error("Error: AGENTI_SKILL_ESCROW_CONTRACT not set in environment");
    process.exit(1);
  }

  if (!operatorAddress) {
    console.error("Error: PLATFORM_WALLET_ADDRESS not set in environment");
    process.exit(1);
  }

  if (!privateKey) {
    console.error("Error: ACCOUNT_PRIVATE_KEY not set in environment");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Deployer:", wallet.address);
  console.log("Escrow:", escrowAddress);
  console.log("Operator to add:", operatorAddress);

  const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, wallet);

  console.log("\nSetting operator on escrow contract...");
  
  const tx = await escrow.setOperator(operatorAddress, true);
  const receipt = await tx.wait();

  console.log("\n=== Success ===");
  console.log(`Transaction: ${tx.hash}`);
  console.log(`Block: ${receipt?.blockNumber}`);
  console.log(`\nOperator ${operatorAddress} is now enabled.`);
  console.log(`\nExplorer: https://testnet.arcscan.app/address/${escrowAddress}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});