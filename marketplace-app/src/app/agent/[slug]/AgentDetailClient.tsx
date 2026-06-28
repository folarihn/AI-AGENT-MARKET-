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
  Link2,
  Check,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useAccount, useSwitchChain, useSendTransaction, usePublicClient, useSignMessage } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { SiweMessage } from 'siwe';
import { ARC_CHAIN_ID, ARC_EXPLORER_URL } from '@/lib/wagmi';
import ReviewForm from '@/components/ReviewForm';
import ReviewList from '@/components/ReviewList';
import SecurityPermissions, { type ScanSummary } from '@/components/SecurityPermissions';
import ReportAgentModal from '@/components/ReportAgentModal';
import { FavoriteButton } from '@/components/FavoriteButton';

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
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>You&apos;re on the list!</span>
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
  const cmd = `unzip ${slug}.zip && cd ${slug} && python3 main.py`;

  const copy = () => {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
      <h2 className="text-sm font-bold text-gray-700 uppercase mb-2 flex items-center gap-2">
        <Terminal size={14} /> How to run
      </h2>
      <p className="text-xs text-gray-500 mb-2">
        Download the package above, then unzip and run its entrypoint. Check the README below
        for the exact inputs and outputs (some packages use <code>node main.js</code>).
      </p>
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
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    color: '#6b7280',
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
  const [payStatus, setPayStatus] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const { address, isConnected, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();
  const { signMessageAsync } = useSignMessage();
  const publicClient = usePublicClient();

  // Link the connected wallet to the account so the payment can be tied to the
  // buyer's identity (server checks the USDC transfer came from this wallet).
  const ensureWalletLinked = async (): Promise<boolean> => {
    const bound = (user as { walletAddress?: string } | undefined)?.walletAddress;
    if (bound && address && bound.toLowerCase() === address.toLowerCase()) return true;
    if (!address) return false;
    try {
      const { nonce } = await fetch('/api/auth/nonce').then((r) => r.json());
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Link this wallet to your AgentMarket account',
        uri: window.location.origin,
        version: '1',
        chainId: ARC_CHAIN_ID,
        nonce,
        expirationTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }).prepareMessage();
      const signature = await signMessageAsync({ message });
      const res = await fetch('/api/user/wallet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Could not link your wallet.');
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

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

  const handleBuyArc = async () => {
    if (!user) { router.push('/login'); return; }
    if (!isConnected || !address) { openConnectModal?.(); return; }
    setIsLoading(true);
    setLastTx(null);
    setPayStatus('Preparing…');
    try {
      if (chainId !== ARC_CHAIN_ID) {
        setPayStatus('Switch to Arc Testnet in your wallet…');
        await switchChainAsync({ chainId: ARC_CHAIN_ID });
      }

      setPayStatus('Linking your wallet…');
      if (!(await ensureWalletLinked())) { setPayStatus(null); return; }

      const info = await fetch(`/api/agents/${agent.id}/purchase-arc`).then((r) => r.json());
      if (!info?.creatorWallet) {
        alert(info?.error || 'Payment is unavailable for this agent.');
        return;
      }

      const valueWei = BigInt(info.valueWei);

      // Pre-flight balance check against the NATIVE USDC balance (USDC is the
      // native gas token on Arc, so balance is read with getBalance, not an
      // ERC-20 balanceOf).
      if (publicClient) {
        setPayStatus('Checking USDC balance…');
        const balance = await publicClient.getBalance({ address });
        if (balance < valueWei) {
          alert('Not enough USDC on Arc Testnet. Get test USDC from faucet.circle.com and try again.');
          setPayStatus(null);
          return;
        }
      }

      setPayStatus('Confirm the USDC payment in your wallet…');
      // Native USDC transfer (not ERC-20) — send value directly to the creator.
      const hash = await sendTransactionAsync({
        to: info.creatorWallet as `0x${string}`,
        value: valueWei,
        chainId: ARC_CHAIN_ID,
      });
      setLastTx(hash);

      setPayStatus('Waiting for confirmation…');
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });

      setPayStatus('Verifying payment…');
      const res = await fetch(`/api/agents/${agent.id}/purchase-arc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: hash }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHasLicense(true);
        setPayStatus(null);
      } else {
        alert(data?.error || 'Payment could not be verified.');
        setPayStatus(null);
      }
    } catch (e) {
      console.error(e);
      const cancelled = e instanceof Error && /reject|denied|cancell/i.test(e.message);
      alert(cancelled ? 'Payment cancelled.' : 'Payment failed. Please try again.');
      setPayStatus(null);
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
            <div className="mt-3 flex items-center gap-2">
              <FavoriteButton agentId={agent.id} />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href).then(() => {
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                {linkCopied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Link2 className="h-3.5 w-3.5" />}
                {linkCopied ? 'Copied' : 'Copy link'}
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${agent.displayName} on AgentMarket`)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 no-underline hover:bg-gray-50"
              >
                Share on X
              </a>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-gray-900">{agent.price === 0 ? 'Free' : `${agent.price} USDC`}</span>

            {isComingSoon ? null : checkingLicense ? (
              <Button className="mt-2" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...
              </Button>
            ) : hasLicense || agent.price === 0 ? (
              <Button className="mt-2 bg-green-600 hover:bg-green-700" onClick={handleDownload} disabled={!user}>
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            ) : (
              <Button className="mt-2" onClick={handleBuyArc} disabled={isLoading || !user}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><ShoppingCart className="mr-2 h-4 w-4" /> Pay {agent.price} USDC</>
                )}
              </Button>
            )}

            {payStatus && <p className="text-xs text-indigo-600 mt-1">{payStatus}</p>}
            {lastTx && (
              <a
                href={`${ARC_EXPLORER_URL}/tx/${lastTx}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-indigo-600 hover:underline mt-1"
              >
                View transaction ↗
              </a>
            )}
            {!user && !isComingSoon && <p className="text-xs text-gray-500 mt-1">Login required</p>}
            {user && !isComingSoon && agent.price > 0 && !hasLicense && (
              <p className="text-[11px] text-gray-400 mt-1">Pay with USDC on Arc Testnet</p>
            )}
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
