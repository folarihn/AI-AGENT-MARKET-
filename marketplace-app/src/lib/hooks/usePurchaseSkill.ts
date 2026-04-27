'use client';

import { useState, useCallback } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useSwitchChain } from 'wagmi';
import { toHex } from 'viem';
import { ARC_CHAIN_ID, USDC_ADDRESS, AGENTI_MARKETPLACE_ABI } from '@/lib/arc/config';
import type { PurchaseState } from '@/lib/arc/types';

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as string | undefined;
const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS as string | undefined;

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
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const [state, setState] = useState<PurchaseState>('idle');
  const [error, setError] = useState<string | null>(null);

  const isPerCall = pricingModel === 'PER_CALL';
  const isFree = pricingModel === 'FREE' || priceUSDC === 0;

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: ['function balanceOf(address _owner) view returns (uint256)'] as const,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ARC_CHAIN_ID,
  });

  const { data: usdcAllowance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: ['function allowance(address _owner, address _spender) view returns (uint256)'] as const,
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

  const { isLoading: isPurchasePending, isSuccess: isPurchaseSuccess } = useWaitForTransactionReceipt({
    hash: purchaseData,
    chainId: ARC_CHAIN_ID,
  });

  const needsApproval = !isFree && (!usdcAllowance || (usdcBalance as bigint) < BigInt(priceUSDC) || (usdcAllowance as bigint) < BigInt(priceUSDC));

  const handleWriteError = (e: unknown, fallbackMsg: string) => {
    const err = e as { code?: number; message?: string };
    if (err.code === 4001) {
      setError('Transaction rejected by user');
    } else {
      setError(err.message || fallbackMsg);
    }
    setState('error');
  };

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

    if (isFree) {
      setState('purchasing');
      try {
        const res = await fetch('/api/buyer/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skillId }),
        });
        if (!res.ok) throw new Error('Failed to claim free skill');
        setState('done');
      } catch (e) {
        handleWriteError(e, 'Claim failed');
      }
      return;
    }

    if (isPerCall) {
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
            abi: ['function approve(address _spender, uint256 _value) returns (bool)'] as const,
            functionName: 'approve',
            args: [MARKETPLACE_ADDRESS, toHex(BigInt(priceUSDC) * 10n ** 12n)],
            chainId: ARC_CHAIN_ID,
          });
        } catch (e) {
          handleWriteError(e, 'Approval failed');
        }
      } else {
        setState('purchasing');
        try {
          writePurchase({
            address: MARKETPLACE_ADDRESS as `0x${string}`,
            abi: AGENTI_MARKETPLACE_ABI,
            functionName: 'purchaseAgent',
            args: [toHex(BigInt(skillId))],
            chainId: ARC_CHAIN_ID,
          });
        } catch (e) {
          handleWriteError(e, 'Purchase failed');
        }
      }
    }
  }, [address, chainId, priceUSDC, pricingModel, isFree, isPerCall, writeApprove, writePurchase, switchChain, usdcAllowance, skillId]);

  const finalState: PurchaseState = isPurchaseSuccess ? 'done' : isPurchasePending || isApprovePending ? 'transacting' : state;

  return {
    state: finalState,
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