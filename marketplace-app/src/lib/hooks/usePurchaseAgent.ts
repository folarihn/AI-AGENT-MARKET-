'use client';

import { useState, useCallback } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useSwitchChain } from 'wagmi';
import { parseEther, toHex } from 'viem';
import { config, ARC_CHAIN_ID } from '@/lib/wagmi';
import type { PurchaseState } from '@/lib/arc/types';

const USDC_ADDRESS = '0x3600000000000000000000000000000000000000000000';
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as string | undefined;

const USDC_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;

const MARKETPLACE_ABI = [
  {
    name: 'purchaseAgent',
    type: 'function',
    inputs: [{ name: 'agentId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

export function usePurchaseAgent(agentId: string, priceUSDC: number) {
  const { address, chainId, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  const [state, setState] = useState<PurchaseState>('idle');
  const [error, setError] = useState<string | null>(null);

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ARC_CHAIN_ID,
  });

  const { data: usdcAllowance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: [
      {
        name: 'allowance',
        type: 'function',
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
      },
    ],
    functionName: 'allowance',
    args: address && MARKETPLACE_ADDRESS ? [address, MARKETPLACE_ADDRESS as `0x${string}`] as const : undefined,
    chainId: ARC_CHAIN_ID,
  });

  const { writeContract: writeApprove, data: approveData } = useWriteContract();
  const { writeContract: writePurchase, data: purchaseData } = useWriteContract();

  const { isLoading: isApprovePending, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveData,
    chainId: ARC_CHAIN_ID,
  });

  const { isLoading: isPurchasePending, isSuccess: isPurchaseSuccess } = useWaitForTransactionReceipt({
    hash: purchaseData,
    chainId: ARC_CHAIN_ID,
  });

  const needsApproval = !usdcAllowance || (BigInt((usdcBalance as bigint | undefined) ?? 0n)) < BigInt(priceUSDC) || (BigInt((usdcAllowance as bigint | undefined) ?? 0n)) < BigInt(priceUSDC);

  const purchase = useCallback(async () => {
    if (!address || !MARKETPLACE_ADDRESS) {
      setError('Wallet not connected or marketplace not configured');
      return;
    }

    if (chainId !== ARC_CHAIN_ID) {
      try {
        await switchChain({ chainId: ARC_CHAIN_ID });
      } catch {
        setError('Please switch to Arc Testnet network');
        return;
      }
    }

    setError(null);

    if ((usdcAllowance as bigint) < BigInt(priceUSDC)) {
      setState('approving');
      try {
        writeApprove({
          address: USDC_ADDRESS as `0x${string}`,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [MARKETPLACE_ADDRESS as `0x${string}`, BigInt(priceUSDC) * 10n ** 6n],
          chainId: ARC_CHAIN_ID,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Approval failed');
        setState('error');
      }
    } else {
      setState('purchasing');
      try {
        writePurchase({
          address: MARKETPLACE_ADDRESS as `0x${string}`,
          abi: MARKETPLACE_ABI,
          functionName: 'purchaseAgent',
          args: [toHex(BigInt(agentId))],
          chainId: ARC_CHAIN_ID,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Purchase failed');
        setState('error');
      }
    }
  }, [address, chainId, priceUSDC, writeApprove, writePurchase, switchChain, usdcAllowance, agentId]);

  return {
    state,
    error,
    needsApproval,
    purchase,
    reset: () => {
      setState('idle');
      setError(null);
    },
  };
}