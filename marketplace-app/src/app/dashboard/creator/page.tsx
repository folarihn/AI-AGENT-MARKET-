'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Plus, LayoutList, Bot, Layers, ShieldCheck,
  Download, ChevronDown, Loader2,
} from 'lucide-react';
import { DashboardProfile } from '@/components/DashboardProfile';
import { SubmitAgentForm } from '@/components/SubmitAgentForm';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';

type AgentListItem = {
  id: string; slug: string; displayName: string; description: string;
  category: string; itemType: string; price: number;
  creatorName: string; version: string; updatedAt: string;
  verified: boolean; downloads: number; rating: number; reviewsCount: number;
  status?: string;
};

const hue = (id: string) => (id.charCodeAt(0) * 37 + (id.charCodeAt(1) || 1) * 17) % 360;

export default function CreatorDashboard() {
  const { data: session, status: authStatus } = useSession();
  const user = session?.user;
  const [activeView, setActiveView] = useState<'listings' | 'submit'>('listings');
  const [myAgents, setMyAgents] = useState<AgentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Fetch user's agents ── */
  useEffect(() => {
    if (user?.id && (user.role === 'CREATOR' || user.role === 'ADMIN')) {
      setLoading(true);
      fetch(`/api/agents?creatorId=${user.id}&pageSize=50`)
        .then(res => res.json())
        .then(data => {
          setMyAgents(data.items || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  /* ── Glass styles ── */
  const glass = {
    background: 'var(--card-bg)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--card-border)',
  } as const;

  /* ── Loading / Auth states ── */
  if (authStatus === 'loading') {
    return (
      <div className="hero-gradient" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="hero-gradient" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{
          ...glass, borderRadius: '24px', padding: '56px 48px',
          maxWidth: '600px', width: '100%',
          boxShadow: '0 8px 40px rgba(106,90,205,0.1)',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #6a5acd, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <Bot size={28} style={{ color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '16px', letterSpacing: '-0.02em' }}>
            Submit Your AI Agent
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '40px', lineHeight: 1.6 }}>
            Join the AgentMarket creator ecosystem. List your agents and skills, set your price on the ARC testnet, and reach thousands of users.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
            {([
              { title: '1. Describe Your Agent', desc: 'Add a display name, detailed description, and upload a custom avatar picture.', icon: Layers, color: '#6a5acd' },
              { title: '2. Set Your Price', desc: 'List your agent for free or set a price in USDC via the ARC Testnet.', icon: ShieldCheck, color: '#10b981' },
              { title: '3. Upload Package', desc: 'Upload your .zip package containing your agent.json and README.', icon: Download, color: '#f59e0b' },
            ]).map(({ title, desc, icon: Icon, color }) => (
              <div key={title} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <ConnectWalletButton />
          </div>
        </div>
      </div>
    );
  }

  /* ── Upgrade prompt for BUYER users ── */
  if (user.role !== 'CREATOR' && user.role !== 'ADMIN') {
    const handleUpgrade = async () => {
      setIsUpgrading(true);
      setError(null);
      try {
        const res = await fetch('/api/creator/upgrade', { method: 'POST' });
        if (res.ok) {
          window.location.reload();
        } else {
          setError('Failed to upgrade account.');
        }
      } catch {
        setError('Failed to upgrade account.');
      } finally {
        setIsUpgrading(false);
      }
    };

    return (
      <div className="hero-gradient" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          ...glass, borderRadius: '24px', padding: '56px 48px',
          textAlign: 'center', maxWidth: '520px',
          boxShadow: '0 8px 40px rgba(106,90,205,0.1)',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #6a5acd, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Bot size={28} style={{ color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.02em' }}>
            Publish your own Agents
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.6 }}>
            You currently have a Buyer account. Upgrade to a Creator account to submit and sell agents on the marketplace. It&apos;s completely free!
          </p>
          {error && (
            <div style={{
              padding: '10px 16px', borderRadius: '10px', marginBottom: '16px',
              background: 'rgba(239,68,68,0.08)', color: '#ef4444',
              fontSize: '0.875rem', fontWeight: 500,
            }}>
              {error}
            </div>
          )}
          <button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            style={{
              padding: '12px 32px', borderRadius: '999px', border: 'none',
              background: 'linear-gradient(135deg, #6a5acd, #8b5cf6)',
              color: '#fff', fontWeight: 700, fontSize: '1rem',
              cursor: isUpgrading ? 'not-allowed' : 'pointer',
              opacity: isUpgrading ? 0.7 : 1,
              boxShadow: '0 4px 20px rgba(106,90,205,0.35)',
              transition: 'all 0.2s',
            }}
          >
            {isUpgrading ? 'Upgrading…' : 'Become a Creator'}
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════
     ═══ MAIN CREATOR DASHBOARD (sidebar + content) ═══
     ══════════════════════════════════════════════════ */
  return (
    <div className="hero-gradient" style={{ display: 'flex', minHeight: '100vh', fontFamily: 'inherit' }}>

      {/* ══ SIDEBAR ══ */}
      <aside style={{
        ...glass,
        width: '220px', minWidth: '220px',
        borderRight: '1px solid var(--divider)',
        borderRadius: 0,
        display: 'flex', flexDirection: 'column',
        padding: '24px 0',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        background: 'var(--sidebar-bg)',
        boxShadow: '1px 0 0 rgba(0,0,0,0.04)',
      }}>
        {/* Brand */}
        <div style={{ padding: '0 20px 28px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6a5acd, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', fontWeight: 900, color: '#fff', flexShrink: 0,
            }}>A</div>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
              AgentMarket
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ padding: '0 10px', flex: 1 }}>
          <Link href="/marketplace" className="dash-nav-link" style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 12px', borderRadius: '10px', marginBottom: '2px',
            textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
            color: 'var(--text-muted)', background: 'transparent', transition: 'all 0.15s',
          }}>
            <Bot size={15} /> Marketplace
          </Link>

          <div style={{ margin: '18px 0 8px 12px', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Creator
          </div>

          {([
            { key: 'listings' as const, label: 'My Listings', Icon: LayoutList },
            { key: 'submit' as const, label: 'Submit New', Icon: Plus },
          ]).map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setActiveView(key)} className="dash-nav-link" style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 12px', borderRadius: '10px', marginBottom: '2px',
              textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
              color: activeView === key ? '#6a5acd' : 'var(--text-muted)',
              background: activeView === key ? 'rgba(106,90,205,0.1)' : 'transparent',
              transition: 'all 0.15s', border: 'none', cursor: 'pointer', width: '100%',
            }}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>

        {/* Profile / Theme */}
        <div style={{ borderTop: '1px solid var(--divider)', paddingTop: '12px' }}>
          <DashboardProfile />
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <div style={{
          ...glass,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 28px',
          borderBottom: '1px solid var(--divider)',
          borderRadius: 0,
          position: 'sticky', top: 0, zIndex: 20,
          gap: '16px',
          background: 'var(--topbar-bg)',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '10px',
            background: 'rgba(106,90,205,0.08)',
            border: '1px solid rgba(106,90,205,0.15)',
            fontSize: '0.875rem', fontWeight: 600, color: '#6a5acd', cursor: 'default',
          }}>
            <Layers size={14} />
            {activeView === 'submit' ? 'Submit New' : 'My Listings'}
            <ChevronDown size={13} style={{ color: '#a78bfa' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeView === 'listings' && (
              <button onClick={() => setActiveView('submit')} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '10px', border: 'none',
                background: 'var(--accent)', color: '#fff', fontWeight: 600,
                fontSize: '0.8125rem', cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(106,90,205,0.3)',
                transition: 'all 0.2s',
              }}>
                <Plus size={14} /> New Agent
              </button>
            )}
            <div style={{
              fontSize: '0.75rem', fontWeight: 600, color: '#6a5acd',
              padding: '6px 12px', borderRadius: '8px',
              background: 'rgba(106,90,205,0.08)',
              border: '1px solid rgba(106,90,205,0.2)',
            }}>
              Creator
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        {activeView === 'listings' ? (
          <div style={{ padding: '24px 28px 48px' }}>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {([
                { label: 'Total Listings', value: myAgents.length.toString(), color: '#6a5acd' },
                { label: 'Total Downloads', value: myAgents.reduce((s, a) => s + a.downloads, 0).toLocaleString(), color: '#10b981' },
                { label: 'Avg Rating', value: myAgents.length > 0 ? (myAgents.reduce((s, a) => s + a.rating, 0) / myAgents.length).toFixed(1) : '—', color: '#f59e0b' },
              ]).map(({ label, value, color }) => (
                <div key={label} style={{
                  ...glass, borderRadius: '16px', padding: '20px 24px',
                  flex: '1', minWidth: '160px',
                  boxShadow: '0 2px 16px rgba(106,90,205,0.06)',
                }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color, letterSpacing: '-0.02em' }}>
                    {loading ? '…' : value}
                  </div>
                </div>
              ))}
            </div>

            {/* Agents table */}
            <div style={{
              ...glass, borderRadius: '18px', overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(106,90,205,0.08)',
            }}>
              {/* Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 0.8fr 1fr 0.8fr 0.8fr 0.7fr',
                padding: '11px 24px',
                borderBottom: '1px solid var(--divider)',
                fontSize: '0.6875rem', fontWeight: 700,
                color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                <span>Name</span>
                <span>Type</span>
                <span>Category</span>
                <span>Price</span>
                <span>Downloads</span>
                <span>Verified</span>
              </div>

              {/* Loading */}
              {loading && (
                <div style={{ padding: '48px', textAlign: 'center' }}>
                  <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                </div>
              )}

              {/* Rows */}
              {!loading && myAgents.map((a, i) => (
                <Link key={a.id} href={`/agent/${a.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div className="dash-row" style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 0.8fr 1fr 0.8fr 0.8fr 0.7fr',
                    padding: '14px 24px',
                    borderBottom: i < myAgents.length - 1 ? '1px solid var(--divider)' : 'none',
                    alignItems: 'center', transition: 'background 0.15s', cursor: 'pointer',
                  }}>
                    {/* Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                        background: `hsl(${hue(a.id)}, 55%, 52%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.875rem', fontWeight: 700, color: '#fff',
                      }}>
                        {a.displayName.charAt(0)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.displayName}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>v{a.version}</div>
                      </div>
                    </div>

                    {/* Type */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.06em', color: 'var(--text-muted)',
                    }}>
                      {a.itemType === 'SKILL' ? 'Skill' : 'Agent'}
                    </span>

                    {/* Category */}
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {a.category.charAt(0) + a.category.slice(1).toLowerCase()}
                    </span>

                    {/* Price */}
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {a.price === 0 ? 'Free' : `$${a.price}`}
                    </span>

                    {/* Downloads */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Download size={12} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{a.downloads.toLocaleString()}</span>
                    </div>

                    {/* Verified */}
                    {a.verified
                      ? <ShieldCheck size={15} style={{ color: '#10b981' }} />
                      : <span style={{ fontSize: '0.75rem', color: '#d1d5db' }}>—</span>
                    }
                  </div>
                </Link>
              ))}

              {/* Empty state */}
              {!loading && myAgents.length === 0 && (
                <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '14px',
                    background: 'rgba(106,90,205,0.08)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <Bot size={24} style={{ color: 'var(--accent)', opacity: 0.6 }} />
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '16px' }}>
                    You haven&apos;t submitted any agents yet.
                  </p>
                  <button onClick={() => setActiveView('submit')} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '10px 20px', borderRadius: '999px', border: 'none',
                    background: 'var(--accent)', color: '#fff', fontWeight: 600,
                    fontSize: '0.875rem', cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(106,90,205,0.3)',
                  }}>
                    <Plus size={14} /> Submit Your First Agent
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Submit new agent form ── */
          <SubmitAgentForm onSuccess={() => {
            setActiveView('listings');
            // Re-fetch agents
            if (user?.id) {
              fetch(`/api/agents?creatorId=${user.id}&pageSize=50`)
                .then(res => res.json())
                .then(data => setMyAgents(data.items || []));
            }
          }} />
        )}
      </div>
    </div>
  );
}
