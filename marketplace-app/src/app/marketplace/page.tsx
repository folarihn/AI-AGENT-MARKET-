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
  itemType: 'AGENT' | 'SKILL';
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
  const itemType = (parseParam(sp.itemType) || 'ALL') as 'AGENT' | 'SKILL' | 'ALL';

  const data = await searchAgents({
    q,
    category,
    itemType,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Browse Agents & Skills</h1>
        <MarketplaceFilters
          initial={{
            q,
            category,
            itemType,
            priceMin: priceMin?.toString() || '',
            priceMax: priceMax?.toString() || '',
            sort,
          }}
          categories={categories}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.items.map((agent: AgentListItem) => (
          <Link href={`/agent/${agent.slug}`} key={agent.id} className="group">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 h-full flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center text-xl font-bold text-indigo-700">
                  {agent.displayName.charAt(0)}
                </div>
                {agent.verified && (
                  <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Verified
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600">
                {agent.displayName}
                <span className="ml-2 inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                  {agent.itemType === 'SKILL' ? 'Skill' : 'Agent'}
                </span>
              </h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">
                {agent.description}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500 mt-auto pt-4 border-t border-gray-100">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="font-medium text-gray-900">{agent.rating}</span>
                  <span className="mx-1">·</span>
                  <span>{agent.reviewsCount} reviews</span>
                </div>
                <div className="font-bold text-gray-900">
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
  );
}
