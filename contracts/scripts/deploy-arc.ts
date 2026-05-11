import hre from "hardhat";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const ARC_EXPLORER = "https://testnet.arcscan.app";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Network: Arc Testnet (chainId: 5042002)");

  console.log("\n1. Deploying AgentiLicense...");
  const LicenseFactory = await hre.ethers.getContractFactory("AgentiLicense");
  const license = await LicenseFactory.deploy(deployer.address);
  await license.waitForDeployment();
  const licenseAddress = await license.getAddress();
  console.log("AgentiLicense:", licenseAddress);

  console.log("\n2. Deploying AgentiMarketplace...");
  const MarketplaceFactory = await hre.ethers.getContractFactory("AgentiMarketplace");
  const marketplace = await MarketplaceFactory.deploy(
    ARC_USDC_ADDRESS,
    licenseAddress,
    deployer.address
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("AgentiMarketplace:", marketplaceAddress);

  console.log("\n3. Setting marketplace on license contract...");
  const setTx = await license.setMarketplace(marketplaceAddress);
  await setTx.wait();
  console.log("Marketplace set on license ✓");

  const deployment = {
    network: "arc-testnet",
    chainId: 5042002,
    usdc: ARC_USDC_ADDRESS,
    license: licenseAddress,
    marketplace: marketplaceAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    transactionHash: marketplace.deploymentTransaction()?.hash || "",
  };

  const outputDir = join(__dirname, "deployments", "arc-testnet");
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "deployment.json"), JSON.stringify(deployment, null, 2));

  console.log("\n=== Deployment Complete ===");
  console.log(`AgentiLicense:    ${licenseAddress}`);
  console.log(`AgentiMarketplace: ${marketplaceAddress}`);
  console.log(`Explorer: ${ARC_EXPLORER}/address/${marketplaceAddress}`);
  console.log("\n=== Add these to .env.local ===");
  console.log(`NEXT_PUBLIC_LICENSE_ADDRESS=${licenseAddress}`);
  console.log(`NEXT_PUBLIC_MARKETPLACE_ADDRESS=${marketplaceAddress}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
