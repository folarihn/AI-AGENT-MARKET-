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
    <div className="w-full md:w-auto">
      <div className="flex w-full md:w-auto gap-4">
        <div className="relative flex-grow md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search agents..."
            value={q}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => {
            const v = e.target.value as Sort;
            setSort(v);
            push({ sort: v });
          }}
          className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="popular">Popular</option>
          <option value="newest">Newest</option>
          <option value="price">Price</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <div className="flex border border-gray-200 rounded-md overflow-hidden bg-white mr-4">
          {(['ALL', 'AGENT', 'SKILL'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setItemType(t);
                push({ itemType: t });
              }}
              className={`px-4 py-1 text-sm font-medium ${
                itemType === t
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t === 'ALL' ? 'All' : t === 'AGENT' ? 'Agents' : 'Skills'}
            </button>
          ))}
        </div>
        {categories.map((c) => (
          <button
            key={c.label}
            onClick={() => {
              setCategory(c.key);
              push({ category: c.key });
            }}
            className={`px-3 py-1 rounded-full text-sm border ${
              category === c.key
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            {c.label} <span className={category === c.key ? 'text-indigo-100' : 'text-gray-400'}>({c.count})</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Price</label>
          <input
            inputMode="decimal"
            placeholder="Min"
            className="w-24 border border-gray-300 rounded-md py-2 px-3 text-sm"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            onBlur={() => push({ priceMin })}
          />
          <span className="text-gray-400">-</span>
          <input
            inputMode="decimal"
            placeholder="Max"
            className="w-24 border border-gray-300 rounded-md py-2 px-3 text-sm"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            onBlur={() => push({ priceMax })}
          />
        </div>
        <div className="sm:ml-auto">
          <Button
            variant="outline"
            onClick={() => {
              setQ('');
              setCategory(null);
              setPriceMin('');
              setPriceMax('');
              setSort('popular');
              router.push(pathname);
            }}
          >
            Clear filters
          </Button>
        </div>
      </div>
    </div>
  );
}

