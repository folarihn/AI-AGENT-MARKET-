'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';

export default function LoginClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/marketplace';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<'BUYER' | 'CREATOR'>('BUYER');

  const redirectTarget = useMemo(() => {
    const role = session?.user?.role;
    if (role === 'ADMIN') return '/dashboard/admin';
    if (role === 'CREATOR') return '/dashboard/creator';
    return callbackUrl;
  }, [callbackUrl, session?.user?.role]);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(redirectTarget);
    }
  }, [router, redirectTarget, status]);

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signIn('google', { callbackUrl });
    } finally {
      setBusy(false);
    }
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await signIn('credentials', {
        email: signinEmail,
        password: signinPassword,
        redirect: false,
        callbackUrl,
      });

      if (!res?.ok) {
        setError('Invalid email or password');
        return;
      }

      router.replace(callbackUrl);
    } finally {
      setBusy(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          role: signupRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to create account');
        return;
      }

      const loginRes = await signIn('credentials', {
        email: signupEmail,
        password: signupPassword,
        redirect: false,
        callbackUrl,
      });

      if (!loginRes?.ok) {
        setError('Account created, but sign-in failed. Try logging in.');
        setMode('signin');
        return;
      }

      router.replace(callbackUrl);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {mode === 'signin' ? 'Sign in' : 'Create an account'}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === 'signin' ? 'default' : 'outline'}
            className="w-full"
            onClick={() => setMode('signin')}
            disabled={busy}
          >
            Sign in
          </Button>
          <Button
            type="button"
            variant={mode === 'signup' ? 'default' : 'outline'}
            className="w-full"
            onClick={() => setMode('signup')}
            disabled={busy}
          >
            Sign up
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px bg-gray-200 w-full" />
            <div className="text-xs text-gray-500">or</div>
            <div className="h-px bg-gray-200 w-full" />
          </div>

          {mode === 'signin' ? (
            <form className="space-y-4" onSubmit={handleCredentialsSignIn}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={signinEmail}
                  onChange={(e) => setSigninEmail(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  required
                  value={signinPassword}
                  onChange={(e) => setSigninPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign in
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleSignup}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <div className="text-xs text-gray-500 mt-1">Minimum 8 characters</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value as 'BUYER' | 'CREATOR')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="BUYER">Buyer</option>
                  <option value="CREATOR">Creator</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create account
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
