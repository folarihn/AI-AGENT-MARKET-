'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { DashboardProfile } from './DashboardProfile';

export type DrawerItem = { href: string; label: string; active: boolean };

const rowStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 12px',
  borderRadius: '10px',
  marginBottom: '2px',
  textDecoration: 'none',
  fontSize: '0.9375rem',
  fontWeight: 500,
  color: active ? '#6a5acd' : 'var(--text-primary)',
  background: active ? 'rgba(106,90,205,0.1)' : 'transparent',
});

export function MobileNavDrawer({ nav, categories }: { nav: DrawerItem[]; categories: DrawerItem[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        className="mp-hamburger"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          border: '1px solid rgba(106,90,205,0.2)',
          background: 'rgba(106,90,205,0.08)',
          color: '#6a5acd',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <Menu size={18} />
      </button>

      {open && (
        <div
          onClick={close}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '82%',
              maxWidth: '300px',
              background: 'var(--sidebar-bg, #fff)',
              boxShadow: '2px 0 28px rgba(0,0,0,0.25)',
              padding: '18px 0',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 18px 16px' }}>
              <Link href="/" onClick={close} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '9px',
                  background: 'linear-gradient(135deg, #6a5acd, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.95rem', fontWeight: 900, color: '#fff',
                }}>A</div>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>AgentMarket</span>
              </Link>
              <button onClick={close} aria-label="Close menu" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <nav style={{ padding: '0 10px', flex: 1 }}>
              {nav.map((it) => (
                <Link key={it.label} href={it.href} onClick={close} style={rowStyle(it.active)}>
                  {it.label}
                </Link>
              ))}

              <div style={{ margin: '18px 0 8px 12px', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Categories
              </div>

              {categories.map((it) => (
                <Link key={it.label} href={it.href} onClick={close} style={rowStyle(it.active)}>
                  {it.label}
                </Link>
              ))}
            </nav>

            <div style={{ borderTop: '1px solid var(--divider)', paddingTop: '12px' }} onClick={close}>
              <DashboardProfile />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
