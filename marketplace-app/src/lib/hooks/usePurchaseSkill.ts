'use client';

import { useState, useCallback } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useSwitchChain } from 'wagmi';
import { toHex } from 'viem';
import { config, ARC_CHAIN_ID } from '@/lib/wagmi';
import type { PurchaseState } from '@/lib/arc/types';

const USDC_ADDRESS = '0x3600000000000000000000000000000000000000000';
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as string | undefined;
const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS as string | undefined;

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

export type PricingModel = 'FREE' | 'ONE_TIME' | 'PER_CALL' | undefined;

interface UsePurchaseSkillProps {
  skillId: string;
  priceUSDC: number;
  pricingModel: PricingModel;
  skillSlug?: string;
}

export interface UsePurchaseSkillResult {
  state: PurchaseState;
  error: string | null;
  needsApproval: boolean;
  isPerCall: boolean;
  isFree: boolean;
  purchase: () => Promise<void>;
  reset: () => void;
}

export function usePurchaseSkill({ skillId, priceUSDC, pricingModel, skillSlug }: UsePurchaseSkillProps): UsePurchaseSkillResult {
  const { address, chainId, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  const [state, setState] = useState<PurchaseState>('idle');
  const [error, setError] = useState<string | null>(null);

  const isPerCall = pricingModel === 'PER_CALL';
  const isFree = pricingModel === 'FREE' || priceUSDC === 0;

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
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
      },
    ],
    functionName: 'allowance',
    args: address && isPerCall && ESCROW_ADDRESS
      ? [address, ESCROW_ADDRESS]
      : address && MARKETPLACE_ADDRESS
        ? [address, MARKETPLACE_ADDRESS]
        : undefined,
    chainId: ARC_CHAIN_ID,
  });

  const { writeContract: writeApprove, data: approveData } = useWriteContract();
  const { writeContract: writePurchase, data: purchaseData } = useWriteContract();

  const { isLoading: isApprovePending } = useWaitForTransactionReceipt({
    hash: approveData,
    chainId: ARC_CHAIN_ID,
  });

  const { isLoading: isPurchasePending, isSuccess } = useWaitForTransactionReceipt({
    hash: purchaseData,
    chainId: ARC_CHAIN_ID,
  });

  const needsApproval = !isFree && (!usdcAllowance || (usdcBalance as bigint) < BigInt(priceUSDC) || (usdcAllowance as bigint) < BigInt(priceUSDC));

  const purchase = useCallback(async () => {
    if (!address) {
      setError('Wallet not connected');
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

    if (pricingModel === 'FREE' || priceUSDC === 0) {
      setState('purchasing');
      try {
        const res = await fetch('/api/buyer/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skillId }),
        });
        if (!res.ok) throw new Error('Failed to claim free skill');
        setState('success');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Claim failed');
        setState('error');
      }
      return;
    }

    if (pricingModel === 'PER_CALL') {
      if (!ESCROW_ADDRESS) {
        setError('Escrow not configured');
        return;
      }
      setState('redirect');
      return;
    }

    if (pricingModel === 'ONE_TIME') {
      if (!MARKETPLACE_ADDRESS) {
        setError('Marketplace not configured');
        return;
      }

      if ((usdcAllowance as bigint) < BigInt(priceUSDC)) {
        setState('approving');
        try {
          writeApprove({
            address: USDC_ADDRESS as `0x${string}`,
            abi: USDC_ABI,
            functionName: 'approve',
            args: [MARKETPLACE_ADDRESS, toHex(BigInt(priceUSDC) * 10n ** 12n)],
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
            args: [toHex(BigInt(skillId))],
            chainId: ARC_CHAIN_ID,
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Purchase failed');
          setState('error');
        }
      }
    }
  }, [address, chainId, priceUSDC, pricingModel, skillId, skillSlug, writeApprove, writePurchase, switchChain, usdcAllowance]);

  return {
    state,
    error,
    needsApproval,
    isPerCall,
    isFree,
    purchase,
    reset: () => {
      setState('idle');
      setError(null);
    },
  };
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
          args: [MARKETPLACE_ADDRESS, toHex(BigInt(priceUSDC) * 10n ** 12n)],
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
          args: [toHex(BigInt(skillId))],
          chainId: ARC_CHAIN_ID,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Purchase failed');
        setState('error');
      }
    }
  }, [address, chainId, priceUSDC, writeApprove, writePurchase, switchChain, usdcAllowance, skillId]);

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