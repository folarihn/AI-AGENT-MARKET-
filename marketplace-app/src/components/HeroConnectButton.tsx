'use client';

import { useEffect } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/navigation';
import { Wallet } from 'lucide-react';
import { ARC_CHAIN_ID } from '@/lib/wagmi';

export function HeroConnectButton() {
  const { isConnected, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain();
  const router = useRouter();

  useEffect(() => {
    if (isConnected && chainId !== ARC_CHAIN_ID) {
      switchChain({ chainId: ARC_CHAIN_ID });
    }
  }, [isConnected, chainId, switchChain]);

  useEffect(() => {
    if (isConnected) {
      router.push('/marketplace');
    }
  }, [isConnected, router]);

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
