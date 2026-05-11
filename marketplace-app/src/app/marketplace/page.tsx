export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, Star, TrendingUp, Zap, Database,
  MessageSquare, BarChart2, Code2, FlaskConical,
  MoreHorizontal, Bot, Layers, LayoutDashboard, ChevronDown,
} from 'lucide-react';
import { AgentCategory } from '@prisma/client';
import { searchAgents } from '@/lib/agentSearch';
import { DashboardSearch } from '@/components/DashboardSearch';
import { DashboardProfile } from '@/components/DashboardProfile';

type AgentListItem = {
  id: string; slug: string; displayName: string; description: string;
  category: AgentCategory; itemType: 'AGENT' | 'SKILL'; price: number;
  creatorName: string; version: string; updatedAt: Date;
  verified: boolean; downloads: number; rating: number; reviewsCount: number;
};
type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function param(v: string | string[] | undefined) { return Array.isArray(v) ? v[0] : v; }

const hue = (id: string) => (id.charCodeAt(0) * 37 + (id.charCodeAt(1) || 1) * 17) % 360;

const CATEGORY_NAV = [
  { key: 'AUTOMATION',    label: 'Automation',    Icon: Zap },
  { key: 'DATA',          label: 'Data',          Icon: Database },
  { key: 'COMMUNICATION', label: 'Communication', Icon: MessageSquare },
  { key: 'PRODUCTIVITY',  label: 'Productivity',  Icon: BarChart2 },
  { key: 'DEVTOOLS',      label: 'DevTools',      Icon: Code2 },
  { key: 'RESEARCH',      label: 'Research',      Icon: FlaskConical },
  { key: 'OTHER',         label: 'Other',         Icon: MoreHorizontal },
] as const;

export default async function MarketplacePage({ searchParams }: PageProps) {
  const sp      = (await searchParams) ?? {};
  const q       = (param(sp.q) ?? '').trim();
  const rawCat  = param(sp.category);
  const rawSort = param(sp.sort);
  const rawType = param(sp.itemType);

  const category = (['AUTOMATION','DATA','COMMUNICATION','PRODUCTIVITY','DEVTOOLS','RESEARCH','OTHER'] as const)
    .find(c => c === rawCat?.toUpperCase()) ?? null;
  const sort     = (['newest','price'] as const).find(s => s === rawSort) ?? 'popular';
  const itemType = (['AGENT','SKILL'] as const).find(t => t === rawType) ?? 'ALL';

  const [trending, data] = await Promise.all([
    searchAgents({ sort: 'popular', pageSize: 5, page: 1, itemType: 'ALL', q: '', category: null, priceMin: null, priceMax: null }),
    searchAgents({ q, category, itemType, sort, page: 1, pageSize: 20, priceMin: null, priceMax: null }),
  ]);

  function url(overrides: Record<string, string | null>) {
    const p = new URLSearchParams();
    const m = { q, sort: rawSort ?? null, itemType: rawType ?? null, category: rawCat ?? null, ...overrides };
    if (m.q)        p.set('q', m.q);
    if (m.category) p.set('category', m.category);
    if (m.sort)     p.set('sort', m.sort);
    if (m.itemType) p.set('itemType', m.itemType);
    const qs = p.toString();
    return `/marketplace${qs ? `?${qs}` : ''}`;
  }

  const tabs = [
    { label: 'All',      href: url({ sort: null, itemType: null }),       active: !rawSort && !rawType },
    { label: 'Trending', href: url({ sort: 'popular', itemType: null }),  active: rawSort === 'popular' && !rawType },
    { label: 'New',      href: url({ sort: 'newest',  itemType: null }),  active: rawSort === 'newest' },
    { label: 'Agents',   href: url({ itemType: 'AGENT', sort: null }),    active: rawType === 'AGENT' },
    { label: 'Skills',   href: url({ itemType: 'SKILL', sort: null }),    active: rawType === 'SKILL' },
  ];

  const agents    = data.items    as AgentListItem[];
  const topAgents = trending.items as AgentListItem[];

  /* ── shared styles ── */
  const glass = {
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.7)',
  } as const;

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
          {[
            { href: '/marketplace', label: 'Browse All', Icon: LayoutDashboard, active: !rawCat && !rawType },
            { href: url({ itemType: 'AGENT', category: null, sort: null }), label: 'Agents', Icon: Bot, active: rawType === 'AGENT' },
            { href: url({ itemType: 'SKILL', category: null, sort: null }), label: 'Skills',  Icon: Layers, active: rawType === 'SKILL' },
          ].map(({ href, label, Icon, active }) => (
            <Link key={label} href={href} className="dash-nav-link" style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 12px', borderRadius: '10px', marginBottom: '2px',
              textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
              color: active ? '#6a5acd' : 'var(--text-muted)',
              background: active ? 'rgba(106,90,205,0.1)' : 'transparent',
              transition: 'all 0.15s',
            }}>
              <Icon size={15} /> {label}
            </Link>
          ))}

          <div style={{ margin: '18px 0 8px 12px', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Categories
          </div>

          {CATEGORY_NAV.map(({ key, label, Icon }) => (
            <Link key={key} href={url({ category: key, itemType: null, sort: null })} className="dash-nav-link" style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 12px', borderRadius: '10px', marginBottom: '2px',
              textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
              color: rawCat === key ? '#6a5acd' : 'var(--text-muted)',
              background: rawCat === key ? 'rgba(106,90,205,0.1)' : 'transparent',
              transition: 'all 0.15s',
            }}>
              <Icon size={14} /> {label}
            </Link>
          ))}
        </nav>

        {/* Profile & Theme Toggle */}
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
            <Bot size={14} />
            {rawType === 'AGENT' ? 'Agents' : rawType === 'SKILL' ? 'Skills' : rawCat ? rawCat.charAt(0) + rawCat.slice(1).toLowerCase() : 'All Items'}
            <ChevronDown size={13} style={{ color: '#a78bfa' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Suspense fallback={null}>
              <DashboardSearch initialQ={q} />
            </Suspense>
            <div style={{
              fontSize: '0.75rem', fontWeight: 600, color: '#6a5acd',
              padding: '6px 12px', borderRadius: '8px',
              background: 'rgba(106,90,205,0.08)',
              border: '1px solid rgba(106,90,205,0.2)',
            }}>
              Arc Testnet
            </div>
          </div>
        </div>

        {/* ── Top two panels ── */}
        <div style={{ display: 'flex', gap: '16px', padding: '24px 28px 0', flexWrap: 'wrap' }}>

          {/* Trending card */}
          <div style={{
            ...glass,
            width: '320px', minWidth: '280px',
            borderRadius: '20px',
            overflow: 'hidden', flexShrink: 0,
            boxShadow: '0 4px 24px rgba(106,90,205,0.08)',
          }}>
            <div style={{
              padding: '13px 20px',
              background: 'linear-gradient(135deg, #6a5acd 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <TrendingUp size={14} style={{ color: 'rgba(255,255,255,0.85)' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>Trending</span>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '9px 20px 7px',
              fontSize: '0.6875rem', fontWeight: 700,
              color: 'var(--text-muted)', letterSpacing: '0.06em',
              borderBottom: '1px solid var(--divider)',
            }}>
              <span>AI AGENTS</span><span>RATING / PRICE</span>
            </div>

            {topAgents.map((a, i) => (
              <Link key={a.id} href={`/agent/${a.slug}`} style={{ textDecoration: 'none' }}>
                <div className="dash-trend-row" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 20px',
                  borderBottom: i < topAgents.length - 1 ? '1px solid var(--divider)' : 'none',
                  transition: 'background 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                      background: `hsl(${hue(a.id)}, 58%, 52%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                    }}>
                      {a.displayName.charAt(0)}
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>
                      {a.displayName}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {a.price === 0 ? 'Free' : `$${a.price}`}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#10b981', fontWeight: 600 }}>
                      ★ {a.rating.toFixed(1)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {topAgents.length === 0 && (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No agents yet
              </div>
            )}
          </div>

          {/* Featured card */}
          <div style={{
            flex: 1, minWidth: '280px',
            background: 'linear-gradient(135deg, #3b2480 0%, #5b21b6 45%, #6d28d9 75%, #7c3aed 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(109,40,217,0.3)',
            padding: '36px 40px',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            position: 'relative', overflow: 'hidden', minHeight: '220px',
            boxShadow: '0 8px 40px rgba(109,40,217,0.2)',
          }}>
            <div style={{ position: 'absolute', right: '-60px', top: '-60px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,181,253,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: '35%', bottom: '-50px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: '10px', lineHeight: 1.2 }}>
                AI Agent Marketplace
              </h2>
              <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.7)', marginBottom: '24px', maxWidth: '400px', lineHeight: 1.6 }}>
                Discover, buy, and install verified AI agents and skills. All scanned, reviewed, and ready to run locally.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ display: 'flex' }}>
                  {topAgents.slice(0, 4).map((a, i) => (
                    <div key={a.id} style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: `hsl(${hue(a.id)}, 58%, 52%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                      border: '2px solid #5b21b6',
                      marginLeft: i > 0 ? '-10px' : '0',
                      position: 'relative', zIndex: 4 - i,
                    }}>
                      {a.displayName.charAt(0)}
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                  {data.total}+ Agents &amp; Skills
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Table section ── */}
        <div style={{ padding: '24px 28px 48px' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{
              display: 'flex', gap: '3px',
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.7)',
              borderRadius: '12px', padding: '4px',
              backdropFilter: 'blur(12px)',
            }}>
              {tabs.map(({ label, href, active }) => (
                <Link key={label} href={href} className="dash-tab" style={{
                  padding: '7px 18px', borderRadius: '9px',
                  fontSize: '0.8125rem', fontWeight: 500,
                  textDecoration: 'none',
                  color: active ? '#fff' : '#6b7280',
                  background: active ? '#6a5acd' : 'transparent',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                  boxShadow: active ? '0 2px 8px rgba(106,90,205,0.3)' : 'none',
                }}>
                  {label}
                </Link>
              ))}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {data.total} result{data.total !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Table */}
          <div style={{
            ...glass,
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(106,90,205,0.08)',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
          }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2.2fr 0.8fr 1fr 0.9fr 1fr 0.8fr 1.1fr 0.6fr',
              padding: '11px 24px',
              borderBottom: '1px solid var(--divider)',
              fontSize: '0.6875rem', fontWeight: 700,
              color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              <span>AI Agents</span>
              <span>Price</span>
              <span>Category</span>
              <span>Rating</span>
              <span>Downloads</span>
              <span>Reviews</span>
              <span>Creator</span>
              <span>Verified</span>
            </div>

            {/* Rows */}
            {agents.map((a, i) => (
              <Link key={a.id} href={`/agent/${a.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div className="dash-row" style={{
                  display: 'grid',
                  gridTemplateColumns: '2.2fr 0.8fr 1fr 0.9fr 1fr 0.8fr 1.1fr 0.6fr',
                  padding: '14px 24px',
                  borderBottom: i < agents.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.displayName}</span>
                        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {a.itemType === 'SKILL' ? 'Skill' : 'Agent'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#9ca3af', fontFamily: 'monospace', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.slug.length > 20 ? a.slug.slice(0, 20) + '…' : a.slug}
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {a.price === 0 ? 'Free' : `$${a.price}`}
                  </span>

                  {/* Category */}
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {a.category.charAt(0) + a.category.slice(1).toLowerCase()}
                  </span>

                  {/* Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={11} fill="#f59e0b" color="#f59e0b" />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.rating.toFixed(1)}</span>
                    <span style={{ fontSize: '0.6875rem', color: '#9ca3af' }}>({a.reviewsCount})</span>
                  </div>

                  {/* Downloads */}
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{a.downloads.toLocaleString()}</span>

                  {/* Reviews */}
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{a.reviewsCount}</span>

                  {/* Creator */}
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.creatorName}
                  </span>

                  {/* Verified */}
                  {a.verified
                    ? <ShieldCheck size={15} style={{ color: '#10b981' }} />
                    : <span style={{ fontSize: '0.75rem', color: '#d1d5db' }}>—</span>
                  }
                </div>
              </Link>
            ))}

            {agents.length === 0 && (
              <div style={{ padding: '64px 24px', textAlign: 'center', color: '#9ca3af', fontSize: '0.9375rem' }}>
                No agents found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
