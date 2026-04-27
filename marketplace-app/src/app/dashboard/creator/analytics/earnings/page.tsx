'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, ExternalLink, Loader2, AlertCircle, DollarSign } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useAccount } from 'wagmi';
import { useWithdrawEarnings } from '@/lib/hooks/useWithdrawEarnings';
import Link from 'next/link';

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS as string | undefined;

const ESCROW_ABI = [
  { name: 'getPendingEarnings', type: 'function', inputs: [{ name: 'creator', type: 'address' }, { name: 'skillId', type: 'bytes32' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
] as const;

interface EarningsData {
  skillId: string;
  name: string;
  pricePerCall: number;
  lifetimeCalls: number;
  lifetimeUSDC: number;
}

export default function CreatorEarningsPage() {
  const { data: session, status } = useSession();
  const { address: walletAddress } = useAccount();
  const [earnings, setEarnings] = useState<EarningsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading' || status === 'unauthenticated') return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/creator/earnings');
        if (res.ok) {
          const data = await res.json();
          setEarnings(data.earnings || []);
        } else {
          setError('Failed to load earnings');
        }
      } catch (e) {
        setError('Failed to load earnings');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!session?.user || session.user.role !== 'CREATOR') {
    return (
      <div className="p-8 text-center text-gray-600">
        Access denied. Creator account required.
      </div>
    );
  }

  if (earnings.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
          <p className="text-gray-600 mt-1">Withdraw your per-call skill earnings.</p>
        </div>
        
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <Link
              href="/dashboard/creator/analytics"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            >
              Overview
            </Link>
            <Link
              href="/dashboard/creator/analytics/earnings"
              className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            >
              Earnings
            </Link>
          </nav>
        </div>

        <div className="py-16 text-center">
          <Wallet className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-600">
            You have no per-call skills yet. Upload a skill with per-call pricing to start earning.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-600 mt-1">Withdraw your per-call skill earnings.</p>
      </div>
      
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <Link
            href="/dashboard/creator/analytics"
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Overview
          </Link>
          <Link
            href="/dashboard/creator/analytics/earnings"
            className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Earnings
          </Link>
        </nav>
      </div>

      <div className="space-y-4">
        {earnings.map((item) => (
          <EarningsCard
            key={item.skillId}
            data={item}
            creatorAddress={walletAddress || ''}
          />
        ))}
      </div>
    </div>
  );
}

function EarningsCard({ data, creatorAddress }: { data: EarningsData; creatorAddress: string }) {
  const { step, error, txHash, pendingAmount, canWithdraw, withdraw, isPending, isConfirmed } = 
    useWithdrawEarnings(data.skillId, creatorAddress);

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isConfirmed && txHash) {
      setShowSuccess(true);
    }
  }, [isConfirmed, txHash]);

  if (showSuccess && txHash) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
          <DollarSign className="h-5 w-5" />
          Withdrawal Successful!
        </div>
        <p className="text-green-700 mb-4">
          Your earnings have been withdrawn. Transaction confirmed.
        </p>
        <a
          href={`https://testnet.arcscan.app/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-green-700 hover:underline"
        >
          View on ArcScan <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{data.name}</h3>
          <p className="text-sm text-gray-500">
            ${data.pricePerCall.toFixed(3)}/call • Lifetime: {data.lifetimeCalls} calls • ${data.lifetimeUSDC.toFixed(2)} earned
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            ${pendingAmount.toFixed(3)}
          </div>
          <div className="text-xs text-gray-500">pending</div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm mb-3">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <Button
        onClick={withdraw}
        disabled={!canWithdraw || isPending}
        className="w-full"
        variant={canWithdraw ? 'default' : 'outline'}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Withdrawing...
          </>
        ) : canWithdraw ? (
          `Withdraw $${pendingAmount.toFixed(2)}`
        ) : (
          'Withdraw (min $1.00)'
        )}
      </Button>
    </div>
  );
}