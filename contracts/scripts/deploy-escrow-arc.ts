import { ethers } from "ethers";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";

const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const ARC_EXPLORER = "https://testnet.arcscan.app";

interface Deployment {
  network: string;
  chainId: number;
  usdc: string;
  escrow: string;
  deployer: string;
  timestamp: string;
  transactionHash: string;
}

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const wallet = new ethers.Wallet(process.env.ACCOUNT_PRIVATE_KEY!, provider);
  
  console.log("Deployer:", wallet.address);
  console.log("Network: Arc Testnet (chainId: 5042002)");

  console.log("\nDeploying AgentiSkillEscrow...");
  const escrowFactory = await ethers.getContractFactory("AgentiSkillEscrow", wallet);
  const escrow = await escrowFactory.deploy(ARC_USDC_ADDRESS, wallet.address);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("AgentiSkillEscrow:", escrowAddress);

  const deployment: Deployment = {
    network: "arc-testnet",
    chainId: 5042002,
    usdc: ARC_USDC_ADDRESS,
    escrow: escrowAddress,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    transactionHash: escrow.deploymentTransaction()?.hash || "",
  };

  const outputDir = join(dirname(__file__), "deployments", "arc-testnet");
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(
    join(outputDir, "escrow-deployment.json"),
    JSON.stringify(deployment, null, 2)
  );

  console.log("\n=== Deployment Complete ===");
  console.log(`USDC Token: ${ARC_USDC_ADDRESS}`);
  console.log(`Escrow: ${deployment.escrow}`);
  console.log(`\nExplorer: ${ARC_EXPLORER}/address/${escrowAddress}`);

  console.log("\n=== Next Steps ===");
  console.log(`1. Fund escrow with testnet USDC for testing`);
  console.log(`2. Register per-call skills via registerSkill(bytes32, address, uint256)`);
  console.log(`3. Set NEXT_PUBLIC_ESCROW_ADDRESS=${escrowAddress} in .env.local`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});