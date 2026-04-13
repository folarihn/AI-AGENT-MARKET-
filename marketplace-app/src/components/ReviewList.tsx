'use client';

import { useEffect, useState } from 'react';

type ReviewItem = {
  id: string;
  rating: number;
  body?: string | null;
  createdAt: string;
  reviewerName: string;
  verifiedPurchase: boolean;
};

export default function ReviewList({ agentId }: { agentId: string }) {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [average, setAverage] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/reviews?page=1`, { cache: 'no-store' });
      const data = await res.json();
      setItems(data.items || []);
      setAverage(data.averageRating || 0);
      setCount(data.reviewCount || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">
          Reviews {count > 0 ? `· ${average.toFixed(1)} / 5 · ${count}` : ''}
        </h3>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-gray-100 rounded mt-2 animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-100 rounded mt-2 animate-pulse" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-gray-600">No reviews yet.</div>
      ) : (
        items.map((r) => (
          <div key={r.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StarDisplay value={r.rating} />
                <span className="text-sm text-gray-700">{r.reviewerName}</span>
                {r.verifiedPurchase && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Verified purchase
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </div>
            {r.body && <p className="mt-2 text-sm text-gray-800">{r.body}</p>}
          </div>
        ))
      )}
    </div>
  );
}

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          className={`h-4 w-4 ${n <= value ? 'text-yellow-400' : 'text-gray-300'}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}
