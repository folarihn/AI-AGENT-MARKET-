import hre from "hardhat";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const ARC_EXPLORER = "https://testnet.arcscan.app";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Network: Arc Testnet (chainId: 5042002)");

  console.log("\nDeploying AgentiSkillEscrow...");
  const EscrowFactory = await hre.ethers.getContractFactory("AgentiSkillEscrow");
  const escrow = await EscrowFactory.deploy(ARC_USDC_ADDRESS, deployer.address);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("AgentiSkillEscrow:", escrowAddress);

  const deployment = {
    network: "arc-testnet",
    chainId: 5042002,
    usdc: ARC_USDC_ADDRESS,
    escrow: escrowAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    transactionHash: escrow.deploymentTransaction()?.hash || "",
  };

  const outputDir = join(__dirname, "deployments", "arc-testnet");
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "escrow-deployment.json"), JSON.stringify(deployment, null, 2));

  console.log("\n=== Deployment Complete ===");
  console.log(`AgentiSkillEscrow: ${escrowAddress}`);
  console.log(`Explorer: ${ARC_EXPLORER}/address/${escrowAddress}`);
  console.log("\n=== Add this to .env.local ===");
  console.log(`NEXT_PUBLIC_ESCROW_ADDRESS=${escrowAddress}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
