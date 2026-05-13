'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from 'wagmi';
import { toHex } from 'viem';
import { config, ARC_CHAIN_ID, ARC_EXPLORER_URL } from '@/lib/wagmi';
import { USDC_ADDRESS } from '@/lib/arc/config';
import type { PurchaseState } from '@/lib/arc/types';

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

const ESCROW_ABI = [
  {
    name: 'deposit',
    type: 'function',
    inputs: [
      { name: 'skillId', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'withdraw',
    type: 'function',
    inputs: [{ name: 'skillId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'getBalance',
    type: 'function',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'skillId', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

export function useDepositEscrow(skillId: string, pricePerCall: number) {
  const { address, chainId, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  const [step, setStep] = useState<PurchaseState>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: usdcAllowance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address && ESCROW_ADDRESS ? [address, ESCROW_ADDRESS] : undefined,
    chainId: ARC_CHAIN_ID,
  });

  const { data: escrowBalance } = useReadContract({
    address: ESCROW_ADDRESS as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: 'getBalance',
    args: address && skillId ? [address, skillId as `0x${string}`] : undefined,
    chainId: ARC_CHAIN_ID,
  });

  const { writeContract: writeApprove, data: approveData } = useWriteContract();
  const { writeContract: writeDeposit, data: depositData } = useWriteContract();
  const { writeContract: writeWithdraw, data: withdrawData } = useWriteContract();

  const { isLoading: isApprovePending } = useWaitForTransactionReceipt({
    hash: approveData,
    chainId: ARC_CHAIN_ID,
  });

  const { isLoading: isDepositPending, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositData,
    chainId: ARC_CHAIN_ID,
  });

  const { isLoading: isWithdrawPending, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawData,
    chainId: ARC_CHAIN_ID,
  });

  const currentBalance = escrowBalance ? Number(escrowBalance) / 1_000_000 : 0;
  const estimatedCalls = pricePerCall > 0 ? currentBalance / pricePerCall : 0;

  const needsApproval = !usdcAllowance || (usdcAllowance as bigint) < BigInt(1_000_000);

  const deposit = useCallback(async (amountUSDC: number) => {
    if (!address || !ESCROW_ADDRESS) {
      setError('Wallet not connected or escrow not configured');
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
    const amountRaw = BigInt(amountUSDC * 1_000_000);

    if (needsApproval) {
      setStep('approving');
      try {
        await writeApprove({
          address: USDC_ADDRESS as `0x${string}`,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [ESCROW_ADDRESS as `0x${string}`, amountRaw * 10n],
          chainId: ARC_CHAIN_ID,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Approval failed');
        setStep('error');
      }
    } else {
      setStep('purchasing');
      try {
        await writeDeposit({
          address: ESCROW_ADDRESS as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: 'deposit',
          args: [skillId as `0x${string}`, amountRaw],
          chainId: ARC_CHAIN_ID,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Deposit failed');
        setStep('error');
      }
    }
  }, [address, chainId, needsApproval, writeApprove, writeDeposit, switchChain]);

  const withdraw = useCallback(async () => {
    if (!address || !ESCROW_ADDRESS) {
      setError('Wallet not connected or escrow not configured');
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

    setStep('purchasing');
    try {
      await writeWithdraw({
        address: ESCROW_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'withdraw',
        args: [skillId as `0x${string}`],
        chainId: ARC_CHAIN_ID,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Withdraw failed');
      setStep('error');
    }
  }, [address, chainId, writeWithdraw, switchChain]);

  return {
    step,
    error,
    txHash,
    escrowBalance: currentBalance,
    estimatedCalls,
    needsApproval,
    deposit,
    withdraw,
    isApprovePending,
    isDepositPending,
    isDepositSuccess,
    isWithdrawPending,
    isWithdrawSuccess,
  };
}