'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Download, Loader2, ShieldCheck, ShoppingCart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import ReviewForm from '@/components/ReviewForm';
import ReviewList from '@/components/ReviewList';
import SecurityPermissions, { type ScanSummary } from '@/components/SecurityPermissions';
import ReportAgentModal from '@/components/ReportAgentModal';

export type AgentDetail = {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  description: string;
  creatorName: string;
  version: string;
  updatedAt: string;
  verified: boolean;
  price: number;
  readmeText?: string | null;
  permissions: { network: boolean; filesystem: boolean; subprocess: boolean };
};

export default function AgentDetailClient({
  agent,
  initialReviewSummary,
  scan,
  creatorEmailVerified,
}: {
  agent: AgentDetail;
  initialReviewSummary: { averageRating: number; reviewCount: number };
  scan: ScanSummary | null;
  creatorEmailVerified: boolean;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const [hasLicense, setHasLicense] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingLicense, setCheckingLicense] = useState(true);
  const [reviewSummary, setReviewSummary] = useState(initialReviewSummary);

  useEffect(() => {
    fetch(`/api/agents/${agent.id}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setReviewSummary({ averageRating: d.averageRating || 0, reviewCount: d.reviewCount || 0 }))
      .catch(() => {});
  }, [agent.id]);

  useEffect(() => {
    if (user) {
      fetch(`/api/licenses/check?agentId=${agent.id}`)
        .then((res) => res.json())
        .then((data) => {
          setHasLicense(Boolean(data.hasLicense));
          setCheckingLicense(false);
        })
        .catch(() => setCheckingLicense(false));
    } else {
      setCheckingLicense(false);
    }
  }, [user, agent.id]);

  const handleBuy = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Checkout failed');
      }
    } catch (e) {
      console.error(e);
      alert('Error initiating checkout');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!user) return;
    window.location.href = `/api/agents/${agent.id}/download`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold leading-6 text-gray-900 flex items-center gap-2">
              {agent.displayName}
              {agent.verified && (
                <span title="Verified & Scanned">
                  <ShieldCheck className="h-6 w-6 text-green-500" />
                </span>
              )}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              by {agent.creatorName} • v{agent.version} • Updated {agent.updatedAt}
            </p>
            <p className="mt-2 text-sm text-gray-700">
              <span className="font-semibold">{reviewSummary.averageRating.toFixed(1)} / 5</span> ·{' '}
              {reviewSummary.reviewCount} reviews
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-gray-900">{agent.price === 0 ? 'Free' : `$${agent.price}`}</span>

            {checkingLicense ? (
              <Button className="mt-2" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...
              </Button>
            ) : hasLicense || agent.price === 0 ? (
              <Button className="mt-2 bg-green-600 hover:bg-green-700" onClick={handleDownload} disabled={!user}>
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            ) : (
              <Button className="mt-2" onClick={handleBuy} disabled={isLoading || !user}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" /> Buy Now
                  </>
                )}
              </Button>
            )}

            {!user && <p className="text-xs text-gray-500 mt-1">Login required</p>}
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <section>
                <h2 className="text-lg leading-6 font-medium text-gray-900 mb-2">Description</h2>
                <p className="text-gray-700">{agent.description}</p>
                {agent.readmeText ? (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">README</h3>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{agent.readmeText}</pre>
                  </div>
                ) : null}
              </section>

              <section>
                <h2 className="text-lg leading-6 font-medium text-gray-900 mb-2">Reviews</h2>
                <div className="space-y-4">
                  <ReviewForm agentId={agent.id} hasLicense={hasLicense} />
                  <ReviewList agentId={agent.id} />
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <SecurityPermissions scan={scan} permissions={agent.permissions} creatorEmailVerified={creatorEmailVerified} />

              <div className="flex justify-end">
                <ReportAgentModal agentId={agent.id} />
              </div>

              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h2 className="text-sm font-bold text-gray-700 uppercase mb-2">Package Info</h2>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">License:</dt>
                    <dd className="text-gray-900 font-medium">MIT</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Runtime:</dt>
                    <dd className="text-gray-900 font-medium">Python 3.10</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
