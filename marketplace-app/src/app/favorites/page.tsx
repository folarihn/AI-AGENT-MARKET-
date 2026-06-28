'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Heart, ShieldCheck, Loader2 } from 'lucide-react';

type Item = {
  id: string;
  slug: string;
  displayName: string;
  description: string;
  category: string;
  itemType: 'AGENT' | 'SKILL';
  price: number;
  creatorName: string;
  verified: boolean;
  downloads: number;
  rating: number;
  reviewsCount: number;
};

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.replace('/login?callbackUrl=/favorites');
      return;
    }
    fetch('/api/favorites')
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  }, [session, status, router]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
        <Heart className="h-6 w-6 text-rose-500" fill="#f43f5e" /> Saved
      </h1>
      <p className="mt-1 text-sm text-gray-500">Agents and skills you&apos;ve saved for later.</p>

      {items === null ? (
        <div className="mt-16 flex justify-center text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="font-medium text-gray-700">No saved items yet</p>
          <p className="mt-1 text-sm text-gray-500">Tap “Save” on any agent or skill to keep it here.</p>
          <Link
            href="/marketplace"
            className="mt-4 inline-block rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-indigo-700"
          >
            Browse the marketplace
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <Link
              key={a.id}
              href={`/agent/${a.slug}`}
              className="group rounded-2xl border border-gray-200 bg-white p-5 no-underline transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                  {a.itemType === 'SKILL' ? 'Skill' : 'Agent'}
                </span>
                {a.verified && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
              </div>
              <h2 className="mt-2 font-bold text-gray-900 group-hover:text-indigo-600">{a.displayName}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-gray-500">{a.description}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>by {a.creatorName}</span>
                <span className="font-semibold text-gray-900">{a.price === 0 ? 'Free' : `${a.price} USDC`}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
