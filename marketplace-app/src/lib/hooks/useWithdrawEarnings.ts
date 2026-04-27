'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { ARC_CHAIN_ID, USDC_ADDRESS } from '@/lib/arc/config';
import type { PurchaseState } from '@/lib/arc/types';

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS as string | undefined;

const ESCROW_ABI = [
  { name: 'getPendingEarnings', type: 'function', inputs: [{ name: 'creator', type: 'address' }, { name: 'skillId', type: 'bytes32' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { name: 'withdrawCreatorEarnings', type: 'function', inputs: [{ name: 'skillId', type: 'bytes32' }], outputs: [], stateMutability: 'nonpayable' },
] as const;

const MIN_WITHDRAWAL = 1;

export function useWithdrawEarnings(skillId: string, creatorAddress: string) {
  const { address, chainId } = useAccount();
  
  const [step, setStep] = useState<PurchaseState>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: pendingEarnings } = useReadContract({
    address: ESCROW_ADDRESS as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: 'getPendingEarnings',
    args: creatorAddress && skillId ? [creatorAddress as `0x${string}`, skillId as `0x${string}`] : undefined,
    chainId: ARC_CHAIN_ID,
  });

  const { writeContract, data: writeData } = useWriteContract();

  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash: writeData,
    chainId: ARC_CHAIN_ID,
  });

  const currentAmount = pendingEarnings ? Number(pendingEarnings) / 1_000_000 : 0;
  const canWithdraw = currentAmount >= MIN_WITHDRAWAL;

  const handleError = (e: unknown, fallbackMsg: string) => {
    const err = e as { code?: number; message?: string };
    if (err.code === 4001) {
      setError('Transaction rejected by user');
    } else {
      setError(err.message || fallbackMsg);
    }
    setStep('error');
  };

  const withdraw = useCallback(async () => {
    if (!address || !ESCROW_ADDRESS || !canWithdraw) {
      if (!canWithdraw) setError('Minimum withdrawal not met');
      return;
    }

    if (chainId !== ARC_CHAIN_ID) {
      setError('Wrong network');
      return;
    }

    setError(null);
    setStep('purchasing');

    try {
      writeContract({
        address: ESCROW_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'withdrawCreatorEarnings',
        args: [skillId as `0x${string}`],
        chainId: ARC_CHAIN_ID,
      });
    } catch (e) {
      handleError(e, 'Withdraw failed');
    }
  }, [address, chainId, canWithdraw, skillId, writeContract]);

  const finalStep: PurchaseState = isSuccess ? 'done' : isLoading ? 'transacting' : step;

  return {
    step: finalStep,
    error,
    txHash,
    pendingAmount: currentAmount,
    canWithdraw,
    withdraw,
    isPending: isLoading,
    isConfirmed: isSuccess,
  };
}