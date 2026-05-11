// Arc Network constants and ABIs — wagmi config lives in @/lib/wagmi.ts

export const ARC_CHAIN_ID = 5042002;
export const ARC_RPC_URL = 'https://rpc.testnet.arc.network';
export const ARC_EXPLORER_URL = 'https://testnet.arcscan.app';

export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
export const USDC_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
] as const;

export const AGENTI_MARKETPLACE_ABI = [
  {
    inputs: [
      { name: 'agentId', type: 'bytes32' },
    ],
    name: 'purchaseAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'agentId', type: 'bytes32' },
      { name: 'priceUSDC', type: 'uint256' },
      { name: 'creatorAddress', type: 'address' },
    ],
    name: 'registerAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'bytes32' }],
    name: 'agents',
    outputs: [
      { name: 'agentId', type: 'bytes32' },
      { name: 'priceUSDC', type: 'uint256' },
      { name: 'creatorAddress', type: 'address' },
      { name: 'active', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'agentId', type: 'bytes32' },
      { indexed: true, name: 'buyer', type: 'address' },
      { indexed: true, name: 'creator', type: 'address' },
      { name: 'priceUSDC', type: 'uint256' },
      { name: 'platformFee', type: 'uint256' },
      { name: 'royaltyFee', type: 'uint256' },
    ],
    name: 'AgentPurchased',
    type: 'event',
  },
] as const;

export const AGENTI_LICENSE_ABI = [
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'agentId', type: 'uint256' },
    ],
    name: 'agentPrices',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;