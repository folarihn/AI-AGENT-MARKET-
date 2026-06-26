'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User as UserIcon, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useAccount, useSwitchChain } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { ARC_CHAIN_ID } from '@/lib/wagmi';

export function Navbar() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const sessionLoading = status === 'loading';
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { isConnected, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain();

  // Keep a connected wallet on Arc, but DON'T auto-navigate — redirecting to
  // /marketplace whenever a wallet is connected made every other page bounce
  // back here.
  useEffect(() => {
    if (isConnected && chainId !== ARC_CHAIN_ID) {
      switchChain({ chainId: ARC_CHAIN_ID });
    }
  }, [isConnected, chainId, switchChain]);

  if (pathname === '/marketplace' || pathname?.startsWith('/dashboard/creator')) return null;

  const navLinkStyle = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#4b5563',
    textDecoration: 'none',
    transition: 'color 0.2s',
  };

  const mobileLinkStyle = {
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '0.9375rem',
    fontWeight: 500,
    color: '#374151',
    textDecoration: 'none',
  };

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div className="max-w-6xl mx-auto">
        <div className="glass-nav px-6 py-2 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#111827' }}>
              AgentMarket<span style={{ color: '#6a5acd' }}>.</span>
            </span>
          </Link>

          <div className="hidden sm:flex items-center" style={{ gap: '28px' }}>
            <Link href="/marketplace" style={navLinkStyle}>Marketplace</Link>
            <Link href="/collections" style={navLinkStyle}>Collections</Link>
            <Link href="#how-it-works" style={navLinkStyle}>How it Works</Link>

            {user && user.role === 'BUYER' && (
              <Link href="/dashboard/buyer" style={navLinkStyle}>My Library</Link>
            )}

            {user?.role === 'CREATOR' && (
              <Link href="/dashboard/creator" style={navLinkStyle}>Creator Dashboard</Link>
            )}

            {user?.role === 'CREATOR' && (
              <Link
                href="/dashboard/creator/payouts"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#4b5563',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
              >
                Payouts
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link href="/dashboard/admin" style={navLinkStyle}>Admin Dashboard</Link>
            )}

            {(user?.role === 'CREATOR' || user?.role === 'ADMIN') && (
              <Link href="/dashboard/creator/submit" style={{ ...navLinkStyle, color: '#6a5acd', fontWeight: 700 }}>
                + Submit
              </Link>
            )}

            {user && (
              <Link href="/settings/profile" style={navLinkStyle}>Settings</Link>
            )}
          </div>

          {/* Desktop Auth */}
          <div className="hidden sm:flex items-center" style={{ gap: '12px' }}>
            {sessionLoading ? null : user ? (
              <>
                <span style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: 500 }}>{user.name}</span>
                <button
                  onClick={() => signOut({ callbackUrl: '/marketplace' })}
                  style={{
                    fontSize: '0.875rem', fontWeight: 500, color: '#4b5563',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '6px 12px', borderRadius: '8px', transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" style={{ ...navLinkStyle, fontWeight: 600 }}>
                  Sign in
                </Link>
                <button
                  type="button"
                  onClick={() => openConnectModal?.()}
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#fff',
                    padding: '8px 20px',
                    borderRadius: '999px',
                    background: 'var(--accent)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Wallet size={14} />
                  Connect Wallet
                </button>
              </>
            )}
          </div>

          <button
            className="sm:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#374151' }}
          >
            <span className="sr-only">Open main menu</span>
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            className="sm:hidden mt-2"
            style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.5)',
              borderRadius: '16px', padding: '16px', boxShadow: '0 4px 30px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link href="/marketplace" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle}>
                Marketplace
              </Link>
              <Link href="/collections" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle}>
                Collections
              </Link>
              <Link href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle}>
                How it Works
              </Link>

              {user && user.role === 'BUYER' && (
                <Link href="/dashboard/buyer" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle}>
                  My Library
                </Link>
              )}

              {user?.role === 'CREATOR' && (
                <Link href="/dashboard/creator" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle}>
                  Creator Dashboard
                </Link>
              )}

              {user?.role === 'ADMIN' && (
                <Link href="/dashboard/admin" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle}>
                  Admin Dashboard
                </Link>
              )}

              {(user?.role === 'CREATOR' || user?.role === 'ADMIN') && (
                <Link href="/dashboard/creator/submit" onClick={() => setIsMobileMenuOpen(false)} style={{ ...mobileLinkStyle, color: '#6a5acd', fontWeight: 700 }}>
                  + Submit Agent / Skill
                </Link>
              )}

              {user && (
                <Link href="/settings/profile" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle}>
                  Settings
                </Link>
              )}
            </div>

            <div style={{ paddingTop: '8px' }}>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 14px' }}>
                  <UserIcon
                    size={32}
                    style={{ padding: '6px', background: '#f3f4f6', borderRadius: '50%', color: '#6b7280' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{user.email}</div>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/marketplace' })}
                    style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 14px' }}>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--accent)',
                      background: 'rgba(106, 90, 205, 0.1)',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      textAlign: 'center',
                    }}
                  >
                    Sign in with email
                  </Link>
                  <button
                    type="button"
                    onClick={() => { openConnectModal?.(); setIsMobileMenuOpen(false); }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#fff',
                      background: 'var(--accent)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Wallet size={14} />
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
    {/* Spacer so page content isn't hidden under the fixed navbar. */}
    <div aria-hidden style={{ height: '76px' }} />
    </>
  );
}
