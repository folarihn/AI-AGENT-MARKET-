'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MailWarning, X } from 'lucide-react';

export function VerifyEmailBanner() {
  const { data: session } = useSession();
  const [show, setShow] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setShow(false);
      return;
    }
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => setShow(Boolean(d?.user) && !d.user.emailVerified))
      .catch(() => {});
  }, [session]);

  if (!show || dismissed) return null;

  const resend = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' });
      if (res.ok) setSent(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <MailWarning className="h-4 w-4 shrink-0" />
        <span className="flex-1">
          {sent
            ? 'Verification email sent — check your inbox (and spam).'
            : 'Please verify your email to secure your account and enable payouts.'}
        </span>
        {!sent && (
          <button
            onClick={resend}
            disabled={busy}
            className="shrink-0 rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {busy ? 'Sending…' : 'Resend email'}
          </button>
        )}
        <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="shrink-0 text-amber-700 hover:text-amber-900">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
