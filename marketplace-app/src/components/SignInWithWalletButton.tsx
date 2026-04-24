'use client';

import { useState, useCallback } from 'react';
import { useSignMessage, useAccount } from 'wagmi';
import { SiweMessage } from 'siwe';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { ARC_CHAIN_ID } from '@/lib/wagmi';

type SignState = 'idle' | 'signing' | 'verifying' | 'done' | 'error';

export function SignInWithWalletButton() {
  const router = useRouter();
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [state, setState] = useState<SignState>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    if (chainId !== ARC_CHAIN_ID) {
      setError('Please switch to Arc Testnet');
      return;
    }

    setError(null);
    setState('signing');

    try {
      const nonceRes = await fetch('/api/auth/nonce', { method: 'GET' });
      const { nonce } = await nonceRes.json();

      const domain = typeof window !== 'undefined' ? window.location.host : 'localhost:3001';
      const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';

      const message = new SiweMessage({
        domain,
        address,
        statement: 'Sign in to Agenti Marketplace',
        uri: `${protocol}//${domain}`,
        version: '1',
        chainId: ARC_CHAIN_ID,
        nonce,
        expirationTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });

      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });

      setState('verifying');

      const res = await signIn('siwe', {
        message: message.prepareMessage(),
        signature,
        redirect: false,
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      setState('done');
      
      setTimeout(() => {
        router.push('/marketplace');
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
      setState('error');
    }
  }, [address, isConnected, chainId, signMessageAsync, router]);

  if (!isConnected) {
    return (
      <Button disabled className="w-full">
        Connect wallet to sign in
      </Button>
    );
  }

  if (chainId !== ARC_CHAIN_ID) {
    return (
      <Button disabled className="w-full">
        Switch to Arc Testnet to sign in
      </Button>
    );
  }

  const isLoading = state === 'signing' || state === 'verifying';

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleSignIn}
        disabled={isLoading}
        className="w-full"
      >
        {state === 'signing' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {state === 'verifying' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {state === 'done' && <CheckCircle className="mr-2 h-4 w-4" />}
        {state === 'error' && <AlertCircle className="mr-2 h-4 w-4" />}
        
        {state === 'idle' && 'Sign in with wallet'}
        {state === 'signing' && 'Sign message in wallet'}
        {state === 'verifying' && 'Verifying...'}
        {state === 'done' && 'Signed in!'}
        {state === 'error' && 'Try again'}
      </Button>

      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}

      <p className="text-xs text-gray-500 text-center mt-2">
        You'll be redirected to the marketplace after signing
      </p>
    </div>
  );
}