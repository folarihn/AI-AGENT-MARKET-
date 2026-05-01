'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useTheme } from 'next-themes';
import { LogOut, Sun, Moon, ChevronDown, Wallet, Copy, Check, ExternalLink } from 'lucide-react';
import { ARC_EXPLORER_URL } from '@/lib/wagmi';

export function DashboardProfile() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : '';

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setOpen(false);
    window.location.href = '/';
  };

  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <div ref={menuRef} style={{ position: 'relative', padding: '0 12px' }}>

      {/* Theme toggle — always visible */}
      <button
        id="theme-toggle"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: '100%',
          padding: '9px 12px',
          borderRadius: '10px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          transition: 'background 0.15s',
          color: 'var(--text-primary)',
          marginBottom: isConnected ? '8px' : '0',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--menu-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: isDark
              ? 'rgba(250,204,21,0.12)'
              : 'rgba(99,102,241,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isDark ? (
            <Sun size={13} style={{ color: '#fbbf24' }} />
          ) : (
            <Moon size={13} style={{ color: '#6366f1' }} />
          )}
        </div>
        <span style={{ flex: 1, textAlign: 'left', fontSize: '0.8125rem', fontWeight: 500 }}>
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
        {/* Toggle pill */}
        <div
          style={{
            width: '36px',
            height: '20px',
            borderRadius: '999px',
            background: isDark ? '#6a5acd' : 'rgba(0,0,0,0.15)',
            position: 'relative',
            transition: 'background 0.3s',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: '#fff',
              position: 'absolute',
              top: '3px',
              left: isDark ? '19px' : '3px',
              transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        </div>
      </button>

      {/* Wallet Profile — only when connected */}
      {isConnected && (
        <>
          {/* Profile trigger */}
          <button
            id="profile-menu-trigger"
            onClick={() => setOpen(!open)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '10px 12px',
              borderRadius: '14px',
              border: '1px solid var(--profile-border)',
              background: 'var(--profile-bg)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: open ? '0 2px 12px var(--profile-shadow)' : 'none',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6a5acd, #a78bfa)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Wallet size={15} style={{ color: '#fff' }} />
            </div>
            <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {shortAddress}
              </div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'inline-block',
                  }}
                />
                Connected
              </div>
            </div>
            <ChevronDown
              size={14}
              style={{
                color: 'var(--text-muted)',
                transition: 'transform 0.2s',
                transform: open ? 'rotate(180deg)' : 'rotate(0)',
              }}
            />
          </button>

          {/* Dropdown menu */}
          {open && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: '12px',
                right: '12px',
                background: 'var(--dropdown-bg)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid var(--dropdown-border)',
                borderRadius: '16px',
                boxShadow: '0 12px 40px var(--dropdown-shadow)',
                zIndex: 100,
                overflow: 'hidden',
                animation: 'slideUp 0.2s ease',
              }}
            >
              {/* Wallet info header */}
              <div
                style={{
                  padding: '16px',
                  borderBottom: '1px solid var(--divider)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '8px',
                  }}
                >
                  Wallet
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {shortAddress}
                  </span>
                  <button
                    onClick={handleCopy}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-muted)',
                      transition: 'all 0.15s',
                    }}
                    title="Copy address"
                  >
                    {copied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                  </button>
                  <a
                    href={`${ARC_EXPLORER_URL}/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-muted)',
                      padding: '4px',
                      borderRadius: '6px',
                      transition: 'all 0.15s',
                    }}
                    title="View on Explorer"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* Disconnect */}
              <div style={{ padding: '8px' }}>
                <button
                  id="disconnect-wallet"
                  onClick={handleDisconnect}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    color: '#ef4444',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      background: 'rgba(239,68,68,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <LogOut size={14} style={{ color: '#ef4444' }} />
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                    Disconnect Wallet
                  </span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


