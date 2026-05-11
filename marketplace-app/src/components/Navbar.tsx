'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User as UserIcon, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';

export function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (pathname === '/marketplace') return null;

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div className="max-w-6xl mx-auto">
        <div className="glass-nav px-6 py-2 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: '#111827',
              }}
            >
              AgentMarket<span style={{ color: '#6a5acd' }}>.</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden sm:flex items-center" style={{ gap: '28px' }}>
            <Link
              href="/marketplace"
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#4b5563',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
            >
              Marketplace
            </Link>
            <Link
              href="/collections"
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#4b5563',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
            >
              Collections
            </Link>
            <Link
              href="#how-it-works"
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#4b5563',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
            >
              How it Works
            </Link>

            {user?.role === 'CREATOR' && (
              <Link
                href="/dashboard/creator"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#4b5563',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
              >
                Creator Dashboard
              </Link>
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
              <Link
                href="/dashboard/admin"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#4b5563',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
              >
                Admin Dashboard
              </Link>
            )}
          </div>

          {/* Desktop Auth */}
          <div className="hidden sm:flex items-center" style={{ gap: '12px' }}>
            {user ? (
              <>
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: '#4b5563',
                    fontWeight: 500,
                  }}
                >
                  {user.name}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/marketplace' })}
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#4b5563',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'none')
                  }
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/marketplace"
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#fff',
                    textDecoration: 'none',
                    padding: '8px 20px',
                    borderRadius: '999px',
                    background: 'var(--accent)',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Browse Agents
                </Link>
              </>
            )}

            {/* Hamburger (shown only on mobile but placed here for alignment) */}
          </div>

          {/* Mobile toggle */}
          <button
            className="sm:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#374151',
            }}
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
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.5)',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 4px 30px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link
                href="/marketplace"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  color: '#374151',
                  textDecoration: 'none',
                }}
              >
                Marketplace
              </Link>

              <Link
                href="#how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  color: '#374151',
                  textDecoration: 'none',
                }}
              >
                How it Works
              </Link>

              {user?.role === 'CREATOR' && (
                <Link
                  href="/dashboard/creator"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    color: '#374151',
                    textDecoration: 'none',
                  }}
                >
                  Creator Dashboard
                </Link>
              )}

              {user?.role === 'ADMIN' && (
                <Link
                  href="/dashboard/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    color: '#374151',
                    textDecoration: 'none',
                  }}
                >
                  Admin Dashboard
                </Link>
              )}
            </div>

            <div
              style={{
                paddingTop: '8px',
              }}
            >
              {user ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 14px',
                  }}
                >
                  <UserIcon
                    size={32}
                    style={{
                      padding: '6px',
                      background: '#f3f4f6',
                      borderRadius: '50%',
                      color: '#6b7280',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {user.email}
                    </div>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/marketplace' })}
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: '#6b7280',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', padding: '4px 14px' }}>
                  <Link
                    href="/marketplace"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '10px',
                      borderRadius: '10px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#fff',
                      background: 'var(--accent)',
                      textDecoration: 'none',
                    }}
                  >
                    Browse Agents
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
