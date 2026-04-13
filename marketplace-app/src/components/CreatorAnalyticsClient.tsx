'use client';

import { useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Analytics = {
  totals: {
    totalRevenue: number;
    totalDownloads: number;
    totalPublishedAgents: number;
  };
  perAgent: Array<{
    agentId: string;
    name: string;
    views: number;
    downloads: number;
    revenue: number;
    conversionRate: number;
  }>;
  series: Array<{ date: string; downloads: number }>;
};

type SortKey = 'name' | 'views' | 'downloads' | 'revenue' | 'conversionRate';
type SortDir = 'asc' | 'desc';

export default function CreatorAnalyticsClient({ data }: { data: Analytics }) {
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const items = [...data.perAgent];
    items.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * dir;
      return (Number(av) - Number(bv)) * dir;
    });
    return items;
  }, [data.perAgent, sortDir, sortKey]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Total revenue" value={`$${data.totals.totalRevenue.toFixed(2)}`} />
        <MetricCard title="Total downloads" value={String(data.totals.totalDownloads)} />
        <MetricCard title="Published agents" value={String(data.totals.totalPublishedAgents)} />
      </div>

      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Downloads (last 30 days)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.series}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="downloads" stroke="#4f46e5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Per-agent performance</h2>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <Th label="Agent" onClick={() => toggleSort('name')} active={sortKey === 'name'} dir={sortDir} />
              <Th label="Views" onClick={() => toggleSort('views')} active={sortKey === 'views'} dir={sortDir} />
              <Th label="Downloads" onClick={() => toggleSort('downloads')} active={sortKey === 'downloads'} dir={sortDir} />
              <Th label="Revenue" onClick={() => toggleSort('revenue')} active={sortKey === 'revenue'} dir={sortDir} />
              <Th label="Conversion" onClick={() => toggleSort('conversionRate')} active={sortKey === 'conversionRate'} dir={sortDir} />
            </tr>
          </thead>
          <tbody className="divide-y">
            {sorted.map((a) => (
              <tr key={a.agentId} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                <td className="px-4 py-3 text-gray-700">{a.views}</td>
                <td className="px-4 py-3 text-gray-700">{a.downloads}</td>
                <td className="px-4 py-3 text-gray-700">${a.revenue.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-700">{a.conversionRate.toFixed(2)}%</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-gray-600" colSpan={5}>
                  No agents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

function Th({
  label,
  onClick,
  active,
  dir,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
  dir: 'asc' | 'desc';
}) {
  return (
    <th className="px-4 py-3 text-left font-semibold">
      <button onClick={onClick} className="inline-flex items-center gap-1 hover:text-gray-900">
        {label}
        {active ? <span className="text-xs text-gray-400">{dir === 'asc' ? '▲' : '▼'}</span> : null}
      </button>
    </th>
  );
}
