'use client';

import { useAccount } from 'wagmi';
import { Loader2, Check, AlertCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePurchaseAgent } from '@/lib/hooks/usePurchaseAgent';
import type { PurchaseState } from '@/lib/arc/types';

interface PurchaseButtonProps {
  agentId: string;
  priceUSDC: number;
  onPurchased?: () => void;
}

const stateLabels: Record<PurchaseState, string> = {
  idle: 'Buy Now',
  approving: 'Approving USDC (1/2)',
  purchasing: 'Purchasing (2/2)',
  confirming: 'Confirming',
  done: 'Purchased',
  error: 'Error',
};

export function PurchaseButton({ agentId, priceUSDC, onPurchased }: PurchaseButtonProps) {
  const { isConnected } = useAccount();
  const { state, error, purchase, needsApproval, reset } = usePurchaseAgent(agentId, priceUSDC);

  if (!isConnected) {
    return (
      <Button className="mt-2" disabled>
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  const isLoading = state === 'approving' || state === 'purchasing' || state === 'confirming';
  const isDisabled = isLoading || state === 'done';
  const isError = state === 'error';

  return (
    <div className="flex flex-col gap-2">
      <Button
        className="mt-2"
        onClick={purchase}
        disabled={isDisabled}
        variant={isError ? 'destructive' : 'default'}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {state === 'done' && <Check className="mr-2 h-4 w-4" />}
        {isError && <AlertCircle className="mr-2 h-4 w-4" />}
        {stateLabels[state]}
      </Button>
      
      {state === 'approving' && (
        <p className="text-xs text-muted-foreground text-center">
          Step 1/2: Approve USDC spending
        </p>
      )}
      
      {state === 'purchasing' && (
        <p className="text-xs text-muted-foreground text-center">
          Step 2/2: Complete purchase
        </p>
      )}
      
      {state === 'confirming' && (
        <p className="text-xs text-muted-foreground text-center">
          Purchase confirms in under 1 second on Arc
        </p>
      )}
      
      {state === 'done' && (
        <p className="text-xs text-green-600 text-center">
          Purchase complete! You can now download.
        </p>
      )}
      
      {isError && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
      
      {isError && (
        <Button variant="link" size="sm" onClick={reset} className="text-xs">
          Try again
        </Button>
      )}
    </div>
  );
}