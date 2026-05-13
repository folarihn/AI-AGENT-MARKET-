'use client';

import { createConfig, http } from 'wagmi';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';
import type { Chain } from 'viem';

export const ARC_CHAIN_ID     = 5042002;
export const ARC_RPC_URL      = 'https://rpc.testnet.arc.network';
export const ARC_EXPLORER_URL = 'https://testnet.arcscan.app';
export const USDC_ADDRESS     = (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? '0x3600000000000000000000000000000000000000') as `0x${string}`;

export const arcTestnet = {
  id: ARC_CHAIN_ID,
  name: 'Arc Testnet',
  nativeCurrency: { decimals: 6, name: 'USDC', symbol: 'USDC' },
  rpcUrls: {
    default: { http: [ARC_RPC_URL] },
    public:  { http: [ARC_RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: ARC_EXPLORER_URL },
  },
  testnet: true,
} as const satisfies Chain;

const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const config = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected(),
    metaMask(),
    ...(wcProjectId ? [walletConnect({ projectId: wcProjectId })] : []),
  ],
  transports: {
    [arcTestnet.id]: http(ARC_RPC_URL),
  },
  ssr: true,
});
