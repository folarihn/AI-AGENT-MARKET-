'use client';

import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Wallet } from 'lucide-react';

export function HeroConnectButton() {
  const { openConnectModal } = useConnectModal();

  // NOTE: do NOT auto-redirect to /marketplace when a wallet is connected — that
  // made the homepage un-scrollable (it bounced to /marketplace on load for
  // anyone with a connected wallet).

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
