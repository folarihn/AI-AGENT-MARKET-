'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from 'wagmi';
import { toHex } from 'viem';
import { useRouter } from 'next/navigation';
import { Loader2, Check, AlertCircle, Wallet, Zap, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ARC_CHAIN_ID } from '@/lib/wagmi';
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
] as const;

interface SkillInfo {
  id: string;
  name: string;
  displayName: string;
  pricePerCall: number;
}

interface DepositClientProps {
  skill: SkillInfo;
  walletUSDC: number;
  escrowBalance: number;
  estimatedCallsRemaining: number;
}

export default function DepositClient({
  skill,
  walletUSDC: initialWalletUSDC,
  escrowBalance: initialEscrowBalance,
  estimatedCallsRemaining: initialEstimatedCalls,
}: DepositClientProps) {
  const router = useRouter();
  const { address, chainId, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  
  const [amount, setAmount] = useState<number | null>(null);
  
  const { data: usdcAllowance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address && ESCROW_ADDRESS ? [address, ESCROW_ADDRESS] : undefined,
    chainId: ARC_CHAIN_ID,
  });

  const { writeContract: writeApprove, data: approveData } = useWriteContract();
  const { writeContract: writeDeposit, data: depositData } = useWriteContract();

  const { isLoading: isApprovePending } = useWaitForTransactionReceipt({
    hash: approveData,
    chainId: ARC_CHAIN_ID,
  });

  const { isLoading: isDepositPending, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositData,
    chainId: ARC_CHAIN_ID,
  });

  const needsApproval = !usdcAllowance || (usdcAllowance as bigint) < BigInt(1);

  let step: PurchaseState = 'idle';
  if (needsApproval) step = 'approving';
  else if (isDepositPending) step = 'purchasing';
  else if (isDepositSuccess) step = 'done';

  const handleDeposit = useCallback(async () => {
    if (!amount || amount < 1 || !address || !ESCROW_ADDRESS) {
      return;
    }

    if (chainId !== ARC_CHAIN_ID) {
      try {
        await switchChain({ chainId: ARC_CHAIN_ID });
      } catch {
        return;
      }
    }

    const amountRaw = BigInt(amount * 1_000_000);

    if (needsApproval || (usdcAllowance as bigint) < amountRaw) {
      writeApprove({
        address: USDC_ADDRESS as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [ESCROW_ADDRESS as `0x${string}`, BigInt(toHex(amountRaw * 2n))],
        chainId: ARC_CHAIN_ID,
      });
    } else {
      writeDeposit({
        address: ESCROW_ADDRESS as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'deposit',
        args: [skill.id as `0x${string}`, amountRaw],
        chainId: ARC_CHAIN_ID,
      });
    }
  }, [amount, address, chainId, needsApproval, usdcAllowance, writeApprove, writeDeposit, switchChain]);

  const presets = [5, 10, 25];
  const estimatedCalls = amount && skill.pricePerCall > 0 
    ? Math.floor(amount / skill.pricePerCall) 
    : 0;

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-gray-500">Please connect your wallet first</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Deposit USDC</h1>
      <p className="text-gray-500 mt-1">
        for {skill.displayName} (${skill.pricePerCall.toFixed(3)}/call)
      </p>

      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Wallet USDC balance:</span>
          <span className="font-medium">${initialWalletUSDC.toFixed(3)}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-500">Escrow balance:</span>
          <span className="font-medium">${initialEscrowBalance.toFixed(3)}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-500">Estimated calls:</span>
          <span className="font-medium">~{initialEstimatedCalls} calls remaining</span>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Deposit amount (USDC)
        </label>
        <div className="flex gap-2 mb-2">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset)}
              className={`px-4 py-2 rounded-md border ${
                amount === preset 
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                  : 'border-gray-300 bg-white text-gray-700'
              }`}
            >
              ${preset}
            </button>
          ))}
        </div>
        <input
          type="number"
          min="1"
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Enter amount"
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {amount && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            ≈ {estimatedCalls} calls at ${skill.pricePerCall.toFixed(3)}/call
          </p>
        </div>
      )}

      <Button
        onClick={handleDeposit}
        disabled={!amount || amount < 1 || step === 'done'}
        className="w-full mt-4"
      >
        {step === 'idle' && 'Deposit USDC'}
        {step === 'approving' && <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Approving USDC...</>}
        {step === 'purchasing' && <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Depositing...</>}
        {step === 'done' && <><Check className="mr-2 h-4 w-4" /> Deposited!</>}
      </Button>

      <p className="text-xs text-gray-500 text-center mt-4">
        Deposits are held in the escrow contract. Withdraw anytime.
      </p>
    </div>
  );
}