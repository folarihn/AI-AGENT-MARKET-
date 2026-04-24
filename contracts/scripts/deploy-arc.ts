import { ethers } from "ethers";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";

const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const ARC_EXPLORER = "https://testnet.arcscan.app";

interface Deployment {
  network: string;
  chainId: number;
  usdc: string;
  license: string;
  marketplace: string;
  deployer: string;
  timestamp: string;
  transactionHash: string;
}

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const wallet = new ethers.Wallet(process.env.ACCOUNT_PRIVATE_KEY!, provider);
  
  console.log("Deployer:", wallet.address);
  console.log("Network: Arc Testnet (chainId: 5042002)");

  console.log("\n1. Deploying AgentiLicense...");
  const licenseFactory = await ethers.getContractFactory("AgentiLicense", wallet);
  const license = await licenseFactory.deploy(wallet.address);
  await license.waitForDeployment();
  const licenseAddress = await license.getAddress();
  console.log("AgentiLicense:", licenseAddress);

  console.log("\n2. Deploying AgentiMarketplace...");
  const marketplaceFactory = await ethers.getContractFactory("AgentiMarketplace", wallet);
  const marketplace = await marketplaceFactory.deploy(
    ARC_USDC_ADDRESS,
    licenseAddress,
    wallet.address
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("AgentiMarketplace:", marketplaceAddress);

  console.log("\n3. Setting marketplace on license contract...");
  const setMarketplaceTx = await license.setMarketplace(marketplaceAddress);
  await setMarketplaceTx.wait();
  console.log("Marketplace set on license");

  const deployment: Deployment = {
    network: "arc-testnet",
    chainId: 5042002,
    usdc: ARC_USDC_ADDRESS,
    license: licenseAddress,
    marketplace: marketplaceAddress,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    transactionHash: marketplace.deploymentTransaction()?.hash || "",
  };

  const outputDir = join(dirname(__file__), "deployments", "arc-testnet");
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(
    join(outputDir, "deployment.json"),
    JSON.stringify(deployment, null, 2)
  );

  console.log("\n=== Deployment Complete ===");
  console.log(`USDC Token: ${ARC_USDC_ADDRESS}`);
  console.log(`AgentiLicense: ${deployment.license}`);
  console.log(`AgentiMarketplace: ${deployment.marketplace}`);
  console.log(`\nExplorer: ${ARC_EXPLORER}/address/${marketplaceAddress}`);
  console.log(`\nDeployment saved to deployments/arc-testnet/deployment.json`);

  console.log("\n=== Next Steps ===");
  console.log(`1. Verify contracts on explorer:`);
  console.log(`   npx hardhat verify --network arc-testnet ${licenseAddress} ${wallet.address}`);
  console.log(`   npx hardhat verify --network arc-testnet ${marketplaceAddress} ${ARC_USDC_ADDRESS} ${licenseAddress} ${wallet.address}`);
  console.log(`\n2. Fund deployer with testnet USDC: https://faucet.circle.com`);
  console.log(`\n3. Register agents in the marketplace contract`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});