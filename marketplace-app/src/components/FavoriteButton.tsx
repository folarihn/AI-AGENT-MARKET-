'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function FavoriteButton({ agentId }: { agentId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [fav, setFav] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    fetch(`/api/favorites?agentId=${agentId}`)
      .then((r) => r.json())
      .then((d) => setFav(Boolean(d.favorited)))
      .catch(() => {});
  }, [session, agentId]);

  const toggle = async () => {
    if (!session?.user) {
      router.push('/login');
      return;
    }
    const next = !fav;
    setFav(next); // optimistic
    setBusy(true);
    try {
      if (next) {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId }),
        });
      } else {
        await fetch(`/api/favorites?agentId=${agentId}`, { method: 'DELETE' });
      }
    } catch {
      setFav(!next); // revert on error
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={fav}
      className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
      style={{ color: fav ? '#e11d48' : '#374151' }}
    >
      <Heart className="h-3.5 w-3.5" fill={fav ? '#e11d48' : 'none'} />
      {fav ? 'Saved' : 'Save'}
    </button>
  );
}
