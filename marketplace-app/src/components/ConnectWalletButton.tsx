'use client';

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { Wallet, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ARC_CHAIN_ID } from '@/lib/wagmi';

interface ConnectWalletButtonProps {
  onConnect?: (address: string) => void;
}

export function ConnectWalletButton({ onConnect }: ConnectWalletButtonProps) {
  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();

  const handleConnect = async () => {
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: ARC_CHAIN_ID });
    } catch {
      // ignore - user rejected switch
    }
  };

  if (isPending) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    );
  }

  if (isConnected && address) {
    const isWrongNetwork = chainId !== ARC_CHAIN_ID;
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
      <div className="flex items-center gap-2">
        {isWrongNetwork ? (
          <Button variant="outline" size="sm" onClick={handleSwitchNetwork}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Switch to Arc
          </Button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted">
            <Wallet className="h-4 w-4" />
            <span className="text-sm font-medium">{shortAddress}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-500">
              Arc
            </span>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleConnect}>
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
}