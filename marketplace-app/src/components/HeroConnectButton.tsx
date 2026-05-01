'use client';

import { useEffect, useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/navigation';
import { Wallet } from 'lucide-react';
import { ARC_CHAIN_ID } from '@/lib/wagmi';

export function HeroConnectButton() {
  const [mounted, setMounted] = useState(false);
  const { isConnected, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain();
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  // Auto-switch to Arc Testnet on connect
  useEffect(() => {
    if (isConnected && chainId !== ARC_CHAIN_ID) {
      switchChain({ chainId: ARC_CHAIN_ID });
    }
  }, [isConnected, chainId, switchChain]);

  // Redirect to marketplace as soon as wallet connects
  useEffect(() => {
    if (mounted && isConnected) {
      router.push('/marketplace');
    }
  }, [mounted, isConnected, router]);

  return (
    <button
      type="button"
      className="btn-primary"
      onClick={() => openConnectModal?.()}
    >
      Connect Wallet
      <span className="btn-icon"><Wallet size={14} /></span>
    </button>
  );
}
