'use client';

import { createConfig, http } from 'wagmi/config';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    decimals: 6,
    name: 'USDC',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
    },
    public: {
      http: ['https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
} as const;

export const config = createConfig({
  chains: [mainnet, sepolia, arcTestnet],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [arcTestnet.id]: http('https://rpc.testnet.arc.network'),
  },
});

export const ARC_CHAIN_ID = 5042002;
export const ARC_RPC_URL = 'https://rpc.testnet.arc.network';
export const ARC_EXPLORER_URL = 'https://testnet.arcscan.app';