import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ShieldCheck, Star, ArrowRight } from 'lucide-react';

function canUseDb() {
  return Boolean(process.env.DATABASE_URL);
}

export default async function CollectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!canUseDb()) {
    return <div className="p-8 text-center text-gray-500">Database not configured.</div>;
  }

  const { slug } = await params;

  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      creator: { select: { id: true, name: true } },
      items: {
        include: {
          agent: {
            select: {
              id: true,
              slug: true,
              displayName: true,
              description: true,
              price: true,
              itemType: true,
              rating: true,
              reviewsCount: true,
              verified: true,
            },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!collection || !collection.isPublished) notFound();

  const totalValue = collection.items.reduce((sum, ci) => sum + Number(ci.agent.price), 0);

  return (
    <div className="hero-gradient min-h-screen pt-8 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{ marginBottom: '24px' }}>
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors group"
            style={{ color: '#6b7280', textDecoration: 'none' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform" style={{ color: 'var(--accent)' }}><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
            <span className="group-hover:text-gray-900 transition-colors">All Collections</span>
          </Link>
        </div>

        {/* Collection header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            borderRadius: '24px',
            padding: '48px',
            marginBottom: '40px',
            color: 'white',
          }}
        >
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>
            Collection by{' '}
            <Link href={`/u/${collection.creator.id}`} style={{ color: '#c4b5fd', textDecoration: 'none' }}>
              {collection.creator.name || 'Creator'}
            </Link>
          </p>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '16px' }}>
            {collection.name}
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, maxWidth: '600px', marginBottom: '28px' }}>
            {collection.description}
          </p>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{collection.items.length}</span>
              <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginLeft: '6px' }}>items</span>
            </div>
            {totalValue > 0 && (
              <div>
                <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>${totalValue.toFixed(2)}</span>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginLeft: '6px' }}>total value</span>
              </div>
            )}
          </div>
        </div>

        {/* Items grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {collection.items.map((ci, idx) => (
            <Link key={ci.id} href={`/agent/${ci.agent.slug}`} className="no-underline group">
              <div
                className="h-full flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.6)',
                  padding: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(106,90,205,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 800,
                        color: '#6a5acd',
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: ci.agent.itemType === 'SKILL' ? '#7c3aed' : '#059669',
                        background: ci.agent.itemType === 'SKILL' ? 'rgba(124,58,237,0.08)' : 'rgba(5,150,105,0.08)',
                        borderRadius: '20px',
                        padding: '3px 9px',
                      }}
                    >
                      {ci.agent.itemType === 'SKILL' ? 'Skill' : 'Agent'}
                    </span>
                  </div>
                  {ci.agent.verified && <ShieldCheck size={16} style={{ color: '#10b981' }} />}
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '6px', letterSpacing: '-0.01em' }}>
                  {ci.agent.displayName}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.55, flexGrow: 1, marginBottom: '16px' }} className="line-clamp-2">
                  {ci.agent.description}
                </p>

                <div
                  style={{
                    paddingTop: '14px',
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8125rem' }}>
                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                    <span style={{ color: '#111827', fontWeight: 700 }}>{Number(ci.agent.rating).toFixed(1)}</span>
                    <span style={{ color: '#9ca3af' }}>({ci.agent.reviewsCount})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#111827' }}>
                      {Number(ci.agent.price) === 0 ? 'Free' : `$${Number(ci.agent.price)}`}
                    </span>
                    <ArrowRight size={14} style={{ color: '#9ca3af' }} className="group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
