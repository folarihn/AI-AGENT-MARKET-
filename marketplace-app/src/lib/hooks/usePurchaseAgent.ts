'use client';

import { useState, useCallback } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useSwitchChain } from 'wagmi';
import { toHex } from 'viem';
import { ARC_CHAIN_ID, USDC_ADDRESS, AGENTI_MARKETPLACE_ABI } from '@/lib/arc/config';
import { config } from '@/lib/wagmi';
import type { PurchaseState } from '@/lib/arc/types';

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as string | undefined;

export function usePurchaseAgent(agentId: string, priceUSDC: number) {
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const [state, setState] = useState<PurchaseState>('idle');
  const [error, setError] = useState<string | null>(null);

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
    args: address && MARKETPLACE_ADDRESS ? [address, MARKETPLACE_ADDRESS] : undefined,
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

  const needsApproval = !usdcAllowance || (usdcBalance as bigint) < BigInt(priceUSDC) || (usdcAllowance as bigint) < BigInt(priceUSDC);

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
          abi: ['function approve(address _spender, uint256 _value) returns (bool)'] as const,
          functionName: 'approve',
          args: [MARKETPLACE_ADDRESS, toHex(BigInt(priceUSDC) * 10n ** 12n)],
          chainId: ARC_CHAIN_ID,
        });
      } catch (e: unknown) {
        const err = e as { code?: number; message?: string };
        if (err.code === 4001) {
          setError('Transaction rejected by user');
        } else {
          setError(err.message || 'Approval failed');
        }
        setState('error');
      }
    } else {
      setState('purchasing');
      try {
        writePurchase({
          address: MARKETPLACE_ADDRESS as `0x${string}`,
          abi: AGENTI_MARKETPLACE_ABI,
          functionName: 'purchaseAgent',
          args: [toHex(BigInt(agentId))],
          chainId: ARC_CHAIN_ID,
        });
      } catch (e: unknown) {
        const err = e as { code?: number; message?: string };
        if (err.code === 4001) {
          setError('Transaction rejected by user');
        } else {
          setError(err.message || 'Purchase failed');
        }
        setState('error');
      }
    }
  }, [address, chainId, priceUSDC, writeApprove, writePurchase, switchChain, usdcAllowance, agentId]);

  const finalState: PurchaseState = 
    isApproveSuccess || isPurchaseSuccess ? 'done' :
    isApprovePending || isPurchasePending ? 'transacting' :
    state;

  return {
    state: finalState,
    error,
    needsApproval,
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