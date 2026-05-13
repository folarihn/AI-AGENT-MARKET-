'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { DollarSign, TrendingUp, Download, Eye, ArrowUpRight, Loader2, Star } from 'lucide-react';

interface AgentEarning {
  agentId: string;
  name: string;
  views: number;
  downloads: number;
  revenue: number;
  conversionRate: number;
}

interface Analytics {
  totals: {
    totalRevenue: number;
    totalDownloads: number;
    totalPublishedAgents: number;
  };
  perAgent: AgentEarning[];
  series: Array<{ date: string; downloads: number }>;
}

interface RecentPurchase {
  id: string;
  agentName: string;
  amount: number;
  status: string;
  createdAt: string;
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>{label}</span>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: accent ? `${accent}15` : 'rgba(106,90,205,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accent || '#6a5acd',
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>{sub}</div>}
    </div>
  );
}

export default function PayoutsDashboard() {
  const { data: session, status } = useSession();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [purchases, setPurchases] = useState<RecentPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  const isCreator = session?.user?.role === 'CREATOR' || session?.user?.role === 'ADMIN';

  useEffect(() => {
    if (!isCreator) return;
    Promise.all([
      fetch('/api/creator/analytics').then((r) => r.json()),
      fetch('/api/creator/analytics?purchases=true').then((r) => r.json()),
    ])
      .then(([analyticsData, purchasesData]) => {
        setAnalytics(analyticsData);
        setPurchases(purchasesData.purchases || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isCreator]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="p-8 text-center text-gray-500">
        Creator account required.{' '}
        <Link href="/dashboard/creator" className="text-indigo-600 hover:underline">
          Upgrade here
        </Link>
        .
      </div>
    );
  }

  const totals = analytics?.totals;
  const perAgent = analytics?.perAgent || [];
  const platformFee = 0.2;
  const netRevenue = (totals?.totalRevenue || 0) * (1 - platformFee);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em' }}>
              Earnings & Payouts
            </h1>
            <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '0.9375rem' }}>
              Track your revenue across all published agents and skills.
            </p>
          </div>
          <Link
            href="/dashboard/creator/analytics"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#6a5acd',
              color: 'white',
              borderRadius: '10px',
              padding: '9px 18px',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
            }}
          >
            Full Analytics <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<DollarSign size={16} />}
          label="Gross Revenue"
          value={`$${(totals?.totalRevenue || 0).toFixed(2)}`}
          sub="All completed sales"
          accent="#6a5acd"
        />
        <StatCard
          icon={<TrendingUp size={16} />}
          label="Net Earnings"
          value={`$${netRevenue.toFixed(2)}`}
          sub="After 20% platform fee"
          accent="#10b981"
        />
        <StatCard
          icon={<Download size={16} />}
          label="Total Downloads"
          value={(totals?.totalDownloads || 0).toLocaleString()}
          sub="All time"
          accent="#f59e0b"
        />
        <StatCard
          icon={<Star size={16} />}
          label="Published"
          value={(totals?.totalPublishedAgents || 0).toString()}
          sub="Active listings"
          accent="#3b82f6"
        />
      </div>

      {/* Per-agent breakdown */}
      {perAgent.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
            Per Agent / Skill
          </h2>
          <div
            style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {['Name', 'Views', 'Downloads', 'Conversion', 'Gross', 'Net (80%)'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background: '#f9fafb',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {perAgent
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((ag, i) => (
                    <tr
                      key={ag.agentId}
                      style={{
                        borderBottom: i < perAgent.length - 1 ? '1px solid #f3f4f6' : 'none',
                        background: i % 2 === 0 ? 'white' : '#fafafa',
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>
                        {ag.name}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Eye size={13} style={{ color: '#9ca3af' }} />
                          {ag.views.toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Download size={13} style={{ color: '#9ca3af' }} />
                          {ag.downloads.toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.875rem' }}>
                        <span
                          style={{
                            color: ag.conversionRate > 5 ? '#059669' : '#6b7280',
                            fontWeight: ag.conversionRate > 5 ? 600 : 400,
                          }}
                        >
                          {ag.conversionRate.toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>
                        ${ag.revenue.toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#059669', fontSize: '0.9rem' }}>
                        ${(ag.revenue * 0.8).toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '8px', paddingLeft: '4px' }}>
            Platform fee: 20% of gross revenue. Payouts are processed monthly.
          </p>
        </div>
      )}

      {/* Recent sales */}
      {purchases.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
            Recent Sales
          </h2>
          <div
            style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            {purchases.slice(0, 10).map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: i < purchases.length - 1 ? '1px solid #f3f4f6' : 'none',
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>{p.agentName}</p>
                  <p style={{ fontSize: '0.8125rem', color: '#9ca3af', marginTop: '2px' }}>
                    {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>${Number(p.amount).toFixed(2)}</p>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>net ${(Number(p.amount) * 0.8).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {perAgent.length === 0 && purchases.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '64px 24px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
          }}
        >
          <DollarSign size={40} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            No earnings yet
          </h3>
          <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
            Publish your first agent or skill to start earning.
          </p>
          <Link
            href="/dashboard/creator"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#6a5acd',
              color: 'white',
              borderRadius: '10px',
              padding: '10px 20px',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.9375rem',
            }}
          >
            Go to Creator Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
