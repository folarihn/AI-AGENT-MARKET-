'use client';

import { useMemo, useState } from 'react';
import { BuyerAgentCard, BuyerCardAgent } from '@/components/BuyerAgentCard';

export type LibraryItem = {
  agent: BuyerCardAgent;
  license: { createdAt: string };
  updatedSincePurchase: boolean;
};

export default function BuyerLibraryClient({ items }: { items: LibraryItem[] }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((i) =>
      i.agent.displayName.toLowerCase().includes(term)
    );
  }, [q, items]);

  return (
    <div>
      <div className="mb-6">
        <input
          placeholder="Search your agents…"
          className="block w-full md:w-96 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {filtered.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-white">
          <p className="text-gray-600 mb-4">No agents found in your library.</p>
          <a href="/marketplace" className="text-indigo-600 hover:underline">Browse the marketplace</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <BuyerAgentCard
              key={item.agent.id}
              agent={item.agent}
              purchaseDate={item.license.createdAt}
              updatedSincePurchase={item.updatedSincePurchase}
            />
          ))}
        </div>
      )}
    </div>
  );
}
