'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type Reason = 'MALICIOUS_BEHAVIOR' | 'MISLEADING_DESCRIPTION' | 'BROKEN' | 'SPAM';

export default function ReportAgentModal({ agentId }: { agentId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>('MALICIOUS_BEHAVIOR');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, message }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to submit report');
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => { setOpen(true); setDone(false); setError(null); }}>
        Report this agent
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Report this agent</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setOpen(false)}
                aria-label="Close"
                type="button"
              >
                ×
              </button>
            </div>

            {done ? (
              <div className="mt-4">
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
                  Report submitted. Thanks for helping keep the marketplace safe.
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => setOpen(false)}>Close</Button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reason</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={reason}
                    onChange={(e) => setReason(e.target.value as Reason)}
                  >
                    <option value="MALICIOUS_BEHAVIOR">Malicious behavior</option>
                    <option value="MISLEADING_DESCRIPTION">Misleading description</option>
                    <option value="BROKEN">Broken</option>
                    <option value="SPAM">Spam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Details (optional)</label>
                  <textarea
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What happened? Include steps to reproduce if it's broken."
                  />
                </div>

                {error ? (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>
                ) : null}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={busy}>
                    {busy ? 'Submitting…' : 'Submit report'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

