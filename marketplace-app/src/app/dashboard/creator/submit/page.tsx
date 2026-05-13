'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Bot, Layers, ShieldCheck, Download, Loader2, Sparkles } from 'lucide-react';
import { SubmitAgentForm } from '@/components/SubmitAgentForm';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';

export default function SubmitAgentPage() {
  const { data: session, status: authStatus } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  if (authStatus === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <Loader2 size={28} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  /* ── Not signed in ── */
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '20px',
              background: 'linear-gradient(135deg, #6a5acd, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 28px', boxShadow: '0 8px 32px rgba(106,90,205,0.3)',
            }}>
              <Bot size={32} style={{ color: '#fff' }} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.02em' }}>
              Connect to continue
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '36px' }}>
              You need to connect your wallet before submitting an agent to the marketplace.
            </p>
            <ConnectWalletButton />
          </div>
        </div>
      </div>
    );
  }

  /* ── Needs creator upgrade ── */
  if (user.role !== 'CREATOR' && user.role !== 'ADMIN') {
    const handleUpgrade = async () => {
      setIsUpgrading(true);
      setUpgradeError(null);
      try {
        const res = await fetch('/api/creator/upgrade', { method: 'POST' });
        if (res.ok) window.location.reload();
        else setUpgradeError('Failed to upgrade. Please try again.');
      } catch {
        setUpgradeError('Failed to upgrade. Please try again.');
      } finally {
        setIsUpgrading(false);
      }
    };

    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '20px',
              background: 'linear-gradient(135deg, #6a5acd, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 28px', boxShadow: '0 8px 32px rgba(106,90,205,0.3)',
            }}>
              <Sparkles size={32} style={{ color: '#fff' }} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.02em' }}>
              Become a Creator
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '36px' }}>
              Upgrade your free account to start publishing agents and skills. No cost, takes one click.
            </p>
            {upgradeError && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '16px' }}>{upgradeError}</p>
            )}
            <button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              style={{
                padding: '14px 36px', borderRadius: '999px', border: 'none',
                background: 'linear-gradient(135deg, #6a5acd, #8b5cf6)',
                color: '#fff', fontWeight: 700, fontSize: '1rem',
                cursor: isUpgrading ? 'not-allowed' : 'pointer',
                opacity: isUpgrading ? 0.7 : 1,
                boxShadow: '0 4px 20px rgba(106,90,205,0.35)',
                transition: 'all 0.2s',
              }}
            >
              {isUpgrading ? 'Upgrading…' : 'Upgrade for free'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════
     ══ SUBMIT AGENT PAGE ══
     ══════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
      <TopBar />

      {/* ── Page header ── */}
      <div style={{
        borderBottom: '1px solid var(--divider)',
        padding: '48px 0 40px',
        background: 'linear-gradient(180deg, rgba(106,90,205,0.04) 0%, transparent 100%)',
      }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #6a5acd, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(106,90,205,0.3)',
            }}>
              <Bot size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                Submit an Agent
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                Publish to the AgentMarket marketplace
              </p>
            </div>
          </div>

          {/* Info strip */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}>
            {[
              { icon: Layers, label: 'Describe', desc: 'Name, category & tags' },
              { icon: ShieldCheck, label: 'Price & Permissions', desc: 'Free or paid · declare access' },
              { icon: Download, label: 'Upload', desc: '.zip with agent.json + README' },
            ].map(({ icon: Icon, label, desc }, i) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 16px', borderRadius: '12px',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                flex: '1', minWidth: '200px',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                  background: `rgba(106,90,205,${0.08 + i * 0.04})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={15} style={{ color: '#6a5acd' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form area ── */}
      <div style={{ flex: 1, maxWidth: '860px', width: '100%', margin: '0 auto', padding: '8px 0 64px' }}>
        <SubmitAgentForm onSuccess={() => router.push('/dashboard/creator')} />
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 28px',
      borderBottom: '1px solid var(--divider)',
      background: 'var(--background)',
      position: 'sticky', top: 0, zIndex: 30,
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '8px',
          background: 'linear-gradient(135deg, #6a5acd, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.9rem', fontWeight: 900, color: '#fff',
        }}>A</div>
        <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
          AgentMarket
        </span>
      </Link>

      {/* Back link */}
      <Link href="/dashboard/creator" style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)',
        textDecoration: 'none', padding: '6px 12px', borderRadius: '8px',
        border: '1px solid var(--divider)', transition: 'all 0.15s',
      }}>
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>
    </div>
  );
}
