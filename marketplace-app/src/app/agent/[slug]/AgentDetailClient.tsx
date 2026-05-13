'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Download,
  Loader2,
  ShieldCheck,
  ShoppingCart,
  Terminal,
  Clock,
  BellRing,
  CheckCircle,
  ChevronDown,
} from 'lucide-react';
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
  creatorId: string;
  creatorName: string;
  version: string;
  updatedAt: string;
  verified: boolean;
  price: number;
  status: string;
  readmeText?: string | null;
  permissions: { network: boolean; filesystem: boolean; subprocess: boolean };
};

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  body: string;
  createdAt: string;
}

function WaitlistBox({ agentId }: { agentId: string }) {
  const { data: session } = useSession();
  const [email, setEmail] = useState(session?.user?.email || '');
  const [joined, setJoined] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const emailParam = session?.user?.email ? `&email=${session.user.email}` : '';
    fetch(`/api/waitlist?agentId=${agentId}${emailParam}`)
      .then((r) => r.json())
      .then((d) => {
        setCount(d.count || 0);
        setJoined(Boolean(d.joined));
      })
      .catch(() => {});
  }, [agentId, session?.user?.email]);

  const handleJoin = async () => {
    if (!email.trim()) return;
    setLoading(true);
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, email, name: session?.user?.name }),
    });
    const d = await res.json();
    if (res.ok) {
      setJoined(true);
      setCount(d.count);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
        borderRadius: '16px',
        padding: '24px',
        color: 'white',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <BellRing size={18} style={{ color: '#c4b5fd' }} />
        <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Join the Waitlist</h3>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginBottom: '16px', lineHeight: 1.5 }}>
        {count > 0 ? `${count} people waiting. ` : ''}Be the first to know when this launches.
      </p>

      {joined ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#86efac' }}>
          <CheckCircle size={16} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>You're on the list!</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{
              width: '100%',
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '0.875rem',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleJoin}
            disabled={loading}
            style={{
              background: 'white',
              color: '#312e81',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 16px',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            Notify Me
          </button>
        </div>
      )}
    </div>
  );
}

function CliSnippet({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const cmd = `agenti install ${slug}`;

  const copy = () => {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
      <h2 className="text-sm font-bold text-gray-700 uppercase mb-2 flex items-center gap-2">
        <Terminal size={14} /> Install
      </h2>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#1e1b4b',
          borderRadius: '8px',
          padding: '10px 14px',
        }}
      >
        <span style={{ color: '#a5b4fc', fontSize: '0.8125rem', fontFamily: 'monospace', flexGrow: 1 }}>
          $ {cmd}
        </span>
        <button
          onClick={copy}
          style={{
            background: copied ? '#10b981' : 'rgba(255,255,255,0.12)',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 10px',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

function ChangelogSection({ agentId }: { agentId: string }) {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/agents/${agentId}/changelog`)
      .then((r) => r.json())
      .then((d) => setEntries(d.entries || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [agentId]);

  if (loading || entries.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center gap-2">
        <Clock size={18} /> Changelog
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {entries.map((entry) => (
          <div
            key={entry.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: expanded === entry.id ? '#f9fafb' : 'white',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#6a5acd',
                    background: 'rgba(106,90,205,0.08)',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontFamily: 'monospace',
                  }}
                >
                  v{entry.version}
                </span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827' }}>{entry.title}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    color: '#9ca3af',
                    transform: expanded === entry.id ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s',
                  }}
                />
              </div>
            </button>
            {expanded === entry.id && (
              <div style={{ padding: '0 16px 14px', background: '#f9fafb' }}>
                <pre style={{ fontSize: '0.875rem', color: '#374151', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6, margin: 0 }}>
                  {entry.body}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

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

  const isComingSoon = agent.status === 'COMING_SOON';

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
    if (!user) { router.push('/login'); return; }
    setIsLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert('Checkout failed');
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
              {isComingSoon && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  Coming Soon
                </span>
              )}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              by{' '}
              <Link href={`/u/${agent.creatorId}`} className="text-indigo-600 hover:text-indigo-700">
                {agent.creatorName}
              </Link>{' '}
              • v{agent.version} • Updated {agent.updatedAt}
            </p>
            <p className="mt-2 text-sm text-gray-700">
              <span className="font-semibold">{reviewSummary.averageRating.toFixed(1)} / 5</span> ·{' '}
              {reviewSummary.reviewCount} reviews
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-gray-900">{agent.price === 0 ? 'Free' : `$${agent.price}`}</span>

            {isComingSoon ? null : checkingLicense ? (
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
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><ShoppingCart className="mr-2 h-4 w-4" /> Buy Now</>
                )}
              </Button>
            )}

            {!user && !isComingSoon && <p className="text-xs text-gray-500 mt-1">Login required</p>}
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

              <ChangelogSection agentId={agent.id} />

              {!isComingSoon && (
                <section>
                  <h2 className="text-lg leading-6 font-medium text-gray-900 mb-2">Reviews</h2>
                  <div className="space-y-4">
                    <ReviewForm agentId={agent.id} hasLicense={hasLicense} />
                    <ReviewList agentId={agent.id} />
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-6">
              {isComingSoon && <WaitlistBox agentId={agent.id} />}

              <SecurityPermissions scan={scan} permissions={agent.permissions} creatorEmailVerified={creatorEmailVerified} />

              <CliSnippet slug={agent.slug} />

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

              {!isComingSoon && (
                <div className="flex justify-end">
                  <ReportAgentModal agentId={agent.id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
