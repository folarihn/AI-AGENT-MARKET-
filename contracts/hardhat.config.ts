import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },

  networks: {
    "arc-testnet": {
      url: process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network",
      chainId: 5042002,
      accounts: process.env.ACCOUNT_PRIVATE_KEY
        ? [process.env.ACCOUNT_PRIVATE_KEY]
        : [],
      gasPrice: 160_000_000_000,
    },
  },

  etherscan: {
    "arc-testnet": {
      apiUrl: "https://testnet.arcscan.app/api",
      browserUrl: "https://testnet.arcscan.app",
    },
  },

  sourcify: {
    enabled: false,
  },
};

export default config;