'use client';

import { useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentCategory } from '@prisma/client';

type Sort = 'popular' | 'newest' | 'price';

export default function MarketplaceFilters({
  initial,
  categories,
}: {
  initial: { q: string; category: AgentCategory | null; itemType: 'AGENT' | 'SKILL' | 'ALL'; priceMin: string; priceMax: string; sort: Sort };
  categories: Array<{ key: AgentCategory | null; label: string; count: number }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const debounceRef = useRef<number | null>(null);

  const [q, setQ] = useState(initial.q);
  const [category, setCategory] = useState<AgentCategory | null>(initial.category);
  const [itemType, setItemType] = useState<'AGENT' | 'SKILL' | 'ALL'>(initial.itemType);
  const [priceMin, setPriceMin] = useState(initial.priceMin);
  const [priceMax, setPriceMax] = useState(initial.priceMax);
  const [sort, setSort] = useState<Sort>(initial.sort);
  const [showFilters, setShowFilters] = useState(false);

  const push = (next: { q?: string; category?: AgentCategory | null; itemType?: 'AGENT' | 'SKILL' | 'ALL'; priceMin?: string; priceMax?: string; sort?: Sort }) => {
    const params = new URLSearchParams();
    const nq = next.q ?? q;
    const nc = next.category !== undefined ? next.category : category;
    const ni = next.itemType ?? itemType;
    const pmin = next.priceMin ?? priceMin;
    const pmax = next.priceMax ?? priceMax;
    const s = next.sort ?? sort;

    if (nq.trim()) params.set('q', nq.trim());
    if (nc) params.set('category', nc);
    if (ni !== 'ALL') params.set('itemType', ni);
    if (pmin.trim()) params.set('priceMin', pmin.trim());
    if (pmax.trim()) params.set('priceMax', pmax.trim());
    if (s !== 'popular') params.set('sort', s);

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const onSearchChange = (value: string) => {
    setQ(value);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      push({ q: value });
    }, 300);
  };

  return (
    <div className="w-full flex flex-col items-end gap-3">
      <div className="flex flex-wrap items-center justify-end gap-3 w-full">
        {/* Item Type Dropdown */}
        <div className="relative">
          <select
            value={itemType}
            onChange={(e) => {
              const val = e.target.value as 'AGENT' | 'SKILL' | 'ALL';
              setItemType(val);
              push({ itemType: val });
            }}
            style={{
              padding: '10px 36px 10px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              background: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: '#374151',
              outline: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.2s ease',
              appearance: 'none',
            }}
            onFocus={(e) => (e.target.style.border = '1px solid var(--accent)')}
            onBlur={(e) => (e.target.style.border = '1px solid rgba(255, 255, 255, 0.6)')}
          >
            <option value="ALL">All Items</option>
            <option value="AGENT">Agents Only</option>
            <option value="SKILL">Skills Only</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>

        {/* Category Dropdown */}
        <div className="relative">
          <select
            value={category || ''}
            onChange={(e) => {
              const val = e.target.value as AgentCategory | '';
              const newCat = val === '' ? null : val;
              setCategory(newCat);
              push({ category: newCat });
            }}
            style={{
              padding: '10px 36px 10px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              background: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: '#374151',
              outline: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.2s ease',
              appearance: 'none',
            }}
            onFocus={(e) => (e.target.style.border = '1px solid var(--accent)')}
            onBlur={(e) => (e.target.style.border = '1px solid rgba(255, 255, 255, 0.6)')}
          >
            {categories.map((c) => (
              <option key={c.label} value={c.key || ''}>
                {c.key ? '' : 'All '}Categories{c.key ? `: ${c.label}` : ''}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
          </div>
          <select
            value={sort}
            onChange={(e) => {
              const v = e.target.value as Sort;
              setSort(v);
              push({ sort: v });
            }}
            style={{
              padding: '10px 36px 10px 32px',
              borderRadius: '12px',
              border: '1px solid var(--accent)',
              background: 'rgba(106, 90, 205, 0.05)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: '#111827',
              outline: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(106, 90, 205, 0.1)',
              transition: 'all 0.2s ease',
              appearance: 'none',
            }}
          >
            <option value="popular">Sorted by: Popular</option>
            <option value="newest">Sorted by: Newest</option>
            <option value="price">Sorted by: Price</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          </div>
        </div>

        {/* Filters Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '12px',
            border: showFilters ? '1px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.6)',
            background: showFilters ? 'rgba(106, 90, 205, 0.05)' : 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            fontSize: '0.9375rem',
            fontWeight: 500,
            color: '#374151',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Filters
        </button>
      </div>

      {/* Expanded Filters Drawer */}
      {showFilters && (
        <div 
          className="flex flex-col sm:flex-row items-center gap-4 w-full justify-end p-4 mt-2"
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            borderRadius: '16px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          {/* Search Input */}
          <div className="relative flex-grow md:max-w-xs w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} style={{ color: '#9ca3af' }} />
            </div>
            <input
              type="text"
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                background: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.875rem',
                color: '#111827',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              placeholder="Search agents..."
              value={q}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={(e) => { e.target.style.border = '1px solid var(--accent)'; }}
              onBlur={(e) => { e.target.style.border = '1px solid rgba(255, 255, 255, 0.8)'; }}
            />
          </div>

          {/* Price Filters */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium mr-1">Price:</span>
            <input
              inputMode="decimal"
              placeholder="Min"
              style={{
                width: '70px',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.8)',
                background: 'rgba(255,255,255,0.6)',
                fontSize: '0.875rem',
                outline: 'none',
                color: '#374151',
                transition: 'border 0.2s',
              }}
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.8)'; push({ priceMin }); }}
              onFocus={(e) => (e.target.style.border = '1px solid var(--accent)')}
            />
            <span className="text-gray-400">-</span>
            <input
              inputMode="decimal"
              placeholder="Max"
              style={{
                width: '70px',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.8)',
                background: 'rgba(255,255,255,0.6)',
                fontSize: '0.875rem',
                outline: 'none',
                color: '#374151',
                transition: 'border 0.2s',
              }}
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.8)'; push({ priceMax }); }}
              onFocus={(e) => (e.target.style.border = '1px solid var(--accent)')}
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            style={{ color: '#ef4444', fontWeight: 500 }}
            onClick={() => {
              setQ('');
              setCategory(null);
              setPriceMin('');
              setPriceMax('');
              setSort('popular');
              router.push(pathname);
            }}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

