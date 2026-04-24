import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Star } from 'lucide-react';
import { AgentCategory } from '@prisma/client';
import { searchAgents } from '@/lib/agentSearch';
import MarketplaceFilters from '@/components/MarketplaceFilters';

type AgentListItem = {
  id: string;
  slug: string;
  displayName: string;
  description: string;
  category: AgentCategory;
  price: number;
  creatorName: string;
  version: string;
  updatedAt: Date;
  verified: boolean;
  downloads: number;
  rating: number;
  reviewsCount: number;
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function parseParam(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function normalizeCategory(v: string | undefined): AgentCategory | null {
  if (!v) return null;
  const upper = v.trim().toUpperCase();
  const allowed = new Set<AgentCategory>([
    'AUTOMATION',
    'DATA',
    'COMMUNICATION',
    'PRODUCTIVITY',
    'DEVTOOLS',
    'RESEARCH',
    'OTHER',
  ]);
  return allowed.has(upper as AgentCategory) ? (upper as AgentCategory) : null;
}

function parseNumber(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default async function MarketplacePage({ searchParams }: PageProps) {
  const sp = (await searchParams) || {};

  const q = (parseParam(sp.q) || '').trim();
  const category = normalizeCategory(parseParam(sp.category));
  const priceMin = parseNumber(parseParam(sp.priceMin));
  const priceMax = parseNumber(parseParam(sp.priceMax));
  const sort = (parseParam(sp.sort) || 'popular') as 'popular' | 'newest' | 'price';

  const data = await searchAgents({
    q,
    category,
    priceMin,
    priceMax,
    sort,
    page: 1,
    pageSize: 24,
  });

  const categories = [
    { key: null as AgentCategory | null, label: 'All', count: data.total },
    { key: 'AUTOMATION' as const, label: 'Automation', count: data.countsByCategory.AUTOMATION || 0 },
    { key: 'DATA' as const, label: 'Data', count: data.countsByCategory.DATA || 0 },
    { key: 'COMMUNICATION' as const, label: 'Communication', count: data.countsByCategory.COMMUNICATION || 0 },
    { key: 'PRODUCTIVITY' as const, label: 'Productivity', count: data.countsByCategory.PRODUCTIVITY || 0 },
    { key: 'DEVTOOLS' as const, label: 'DevTools', count: data.countsByCategory.DEVTOOLS || 0 },
    { key: 'RESEARCH' as const, label: 'Research', count: data.countsByCategory.RESEARCH || 0 },
    { key: 'OTHER' as const, label: 'Other', count: data.countsByCategory.OTHER || 0 },
  ];

  return (
    <div className="hero-gradient min-h-screen pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{ marginBottom: '16px' }}>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors group" 
            style={{ color: '#6b7280', textDecoration: 'none' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform" style={{ color: 'var(--accent)' }}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            <span className="group-hover:text-gray-900 transition-colors">Back to Home</span>
          </Link>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Browse Agents<span style={{ color: 'var(--accent)' }}>.</span>
          </h1>
          <MarketplaceFilters
            initial={{
              q,
              category,
              priceMin: priceMin?.toString() || '',
              priceMax: priceMax?.toString() || '',
              sort,
            }}
            categories={categories}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.items.map((agent: AgentListItem) => (
          <Link href={`/agent/${agent.slug}`} key={agent.id} className="no-underline">
            <div
              className="h-full flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
              style={{
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                padding: '28px',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div className="flex justify-between items-start mb-6">
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: 'var(--pill-purple-bg)',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                  }}
                >
                  {agent.displayName.charAt(0)}
                </div>
                {agent.verified && (
                  <span className="pill-badge pill-purple" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                    <ShieldCheck size={14} style={{ marginRight: '4px' }} />
                    Verified
                  </span>
                )}
              </div>
              
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                {agent.displayName}
              </h3>
              
              <p style={{ fontSize: '0.9375rem', color: '#6b7280', lineHeight: 1.6, flexGrow: 1, marginBottom: '24px' }} className="line-clamp-2">
                {agent.description}
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: '#4b5563', fontWeight: 500 }}>
                  <Star size={16} fill="#f59e0b" color="#f59e0b" />
                  <span style={{ color: '#111827', fontWeight: 700 }}>{agent.rating}</span>
                  <span style={{ color: '#9ca3af' }}>({agent.reviewsCount})</span>
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#111827' }}>
                  {agent.price === 0 ? 'Free' : `$${agent.price}`}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {data.items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No agents found matching your criteria.</p>
        </div>
      )}
      </div>
    </div>
  );
}
