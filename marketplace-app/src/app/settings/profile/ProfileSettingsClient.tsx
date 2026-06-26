'use client';

import { useState } from 'react';
import { useAccount, useSwitchChain, useSignMessage } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { SiweMessage } from 'siwe';
import { Button } from '@/components/ui/button';
import { ARC_CHAIN_ID } from '@/lib/wagmi';

type UserProfile = {
  id: string;
  name: string | null;
  email: string;
  role: 'BUYER' | 'CREATOR' | 'ADMIN';
  image: string | null;
  emailVerified: boolean;
  createdAt: string;
  walletAddress: string | null;
};

export default function ProfileSettingsClient({ initialUser }: { initialUser: UserProfile }) {
  const [name, setName] = useState(initialUser.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [wallet, setWallet] = useState(initialUser.walletAddress);
  const [linking, setLinking] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const { address, isConnected, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();

  const linkWallet = async () => {
    setWalletError(null);
    if (!isConnected || !address) { openConnectModal?.(); return; }
    setLinking(true);
    try {
      // Best-effort: nudge the wallet to Arc, but signing a SIWE message works
      // on any chain, so don't fail linking if the switch is rejected/unavailable.
      if (chainId !== ARC_CHAIN_ID) {
        try { await switchChainAsync({ chainId: ARC_CHAIN_ID }); } catch { /* ignore */ }
      }
      const { nonce } = await fetch('/api/auth/nonce').then((r) => r.json());
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Link this wallet to your AgentMarket account to receive payments',
        uri: window.location.origin,
        version: '1',
        chainId: ARC_CHAIN_ID,
        nonce,
        expirationTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }).prepareMessage();
      const signature = await signMessageAsync({ message });
      const res = await fetch('/api/user/wallet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWalletError(data?.error || 'Could not link wallet');
        return;
      }
      setWallet(data.walletAddress);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('linkWallet error:', e);
      const cancelled = /reject|denied|cancell/i.test(msg);
      setWalletError(cancelled ? 'Signature cancelled' : `Could not link wallet: ${msg.slice(0, 180)}`);
    } finally {
      setLinking(false);
    }
  };

  const onSave = async () => {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to save');
        return;
      }
      setSaved(true);
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      <p className="mt-1 text-sm text-gray-600">Update your account details.</p>

      <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-700">Email</div>
            <div className="mt-1 text-sm text-gray-900">{initialUser.email}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">Role</div>
            <div className="mt-1 text-sm text-gray-900">{initialUser.role}</div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            maxLength={60}
            placeholder="Your name"
          />
          <div className="mt-1 text-xs text-gray-500">Shown on your public profile and reviews.</div>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        {saved ? <div className="text-sm text-green-600">Saved.</div> : null}

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="text-sm font-medium text-gray-700">Payout wallet</div>
          <p className="mt-1 text-xs text-gray-500">
            Buyers pay you directly in USDC on Arc Testnet. Link a wallet here to receive payments
            and to verify ownership for purchases.
          </p>

          {wallet ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-mono text-sm text-gray-900 truncate">{wallet}</span>
              <span className="shrink-0 text-xs font-medium text-green-600">Linked ✓</span>
            </div>
          ) : (
            <div className="mt-3">
              <Button onClick={linkWallet} disabled={linking}>
                {linking ? 'Linking…' : isConnected ? 'Sign to link wallet' : 'Connect wallet'}
              </Button>
            </div>
          )}
          {walletError ? <div className="mt-2 text-sm text-red-600">{walletError}</div> : null}
        </div>
      </div>
    </div>
  );
}
