'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ReviewForm({
  agentId,
  hasLicense,
  onSubmitted,
}: {
  agentId: string;
  hasLicense: boolean;
  onSubmitted?: () => void;
}) {
  const [rating, setRating] = useState<number>(5);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hasLicense) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, body }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to submit review');
      }
      setBody('');
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`h-8 w-8 rounded-full border flex items-center justify-center ${
              n <= rating ? 'bg-yellow-400 border-yellow-500 text-white' : 'bg-gray-100 border-gray-300 text-gray-600'
            }`}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
          >
            {n}
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Optional feedback"
        rows={3}
        className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
      />
      {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
      <div className="mt-3">
        <Button type="submit" disabled={busy}>
          {busy ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
}
