import type { Chain, WalletClient } from 'viem';
import type { Config } from 'wagmi/config';

export interface ArcChain extends Chain {
  id: typeof ARC_CHAIN_ID;
  nativeCurrency: {
    decimals: number;
    name: string;
    symbol: string;
  };
}

export const ARC_CHAIN_ID = 5042002 as const;
export const ARC_RPC_URL = 'https://rpc.testnet.arc.network' as const;
export const ARC_EXPLORER_URL = 'https://testnet.arcscan.app' as const;

export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const;

export const arcChain: ArcChain = {
  id: ARC_CHAIN_ID,
  name: 'Arc Testnet',
  nativeCurrency: {
    decimals: 6,
    name: 'USDC',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: {
      http: [ARC_RPC_URL],
    },
    public: {
      http: [ARC_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: ARC_EXPLORER_URL,
    },
  },
  testnet: true,
  formatters: undefined,
  serializers: undefined,
};

export type PurchaseState = 
  | 'idle'
  | 'approving'
  | 'purchasing'
  | 'confirming'
  | 'done'
  | 'error';

export interface PurchaseContextValue {
  state: PurchaseState;
  error: string | null;
  purchase: (agentId: string) => Promise<void>;
  reset: () => void;
}

export interface AgentInfo {
  agentId: string;
  priceUSDC: bigint;
  creatorAddress: string;
  active: boolean;
}

export interface PurchaseEvent {
  agentId: string;
  buyer: string;
  creator: string;
  priceUSDC: bigint;
  platformFee: bigint;
  royaltyFee: bigint;
  transactionHash: string;
  blockNumber: bigint;
}