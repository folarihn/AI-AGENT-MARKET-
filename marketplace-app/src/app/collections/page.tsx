import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ArrowRight, Package, Star } from 'lucide-react';

function canUseDb() {
  return Boolean(process.env.DATABASE_URL);
}

export default async function CollectionsPage() {
  if (!canUseDb()) {
    return <div className="p-8 text-center text-gray-500">Database not configured.</div>;
  }

  const collections = await prisma.collection.findMany({
    where: { isPublished: true },
    include: {
      creator: { select: { id: true, name: true } },
      items: {
        include: {
          agent: {
            select: { id: true, displayName: true, slug: true, price: true, itemType: true, rating: true },
          },
        },
        orderBy: { position: 'asc' },
        take: 4,
      },
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });

  return (
    <div className="hero-gradient min-h-screen pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{ marginBottom: '16px' }}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors group"
            style={{ color: '#6b7280', textDecoration: 'none' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform" style={{ color: 'var(--accent)' }}><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
            <span className="group-hover:text-gray-900 transition-colors">Back to Home</span>
          </Link>
        </div>

        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em' }}>
              Collections<span style={{ color: 'var(--accent)' }}>.</span>
            </h1>
            <p style={{ color: '#6b7280', marginTop: '6px', fontSize: '1.0625rem' }}>
              Curated bundles of agents and skills for every workflow.
            </p>
          </div>
        </div>

        {collections.length === 0 ? (
          <div className="text-center py-24">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No collections published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((col) => (
              <Link key={col.id} href={`/collections/${col.slug}`} className="no-underline group">
                <div
                  className="h-full flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  style={{
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.5)',
                    padding: '28px',
                    boxShadow: '0 4px 30px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: 'rgba(106,90,205,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: '#6a5acd',
                        flexShrink: 0,
                      }}
                    >
                      {col.name.charAt(0)}
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#6a5acd',
                        background: 'rgba(106,90,205,0.08)',
                        borderRadius: '20px',
                        padding: '3px 10px',
                      }}
                    >
                      {col._count.items} items
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 800,
                      color: '#111827',
                      letterSpacing: '-0.02em',
                      marginBottom: '6px',
                    }}
                  >
                    {col.name}
                  </h3>

                  <p
                    style={{ fontSize: '0.9rem', color: '#6b7280', lineHeight: 1.55, flexGrow: 1, marginBottom: '20px' }}
                    className="line-clamp-2"
                  >
                    {col.description}
                  </p>

                  {/* Preview items */}
                  {col.items.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                      {col.items.map((ci) => (
                        <div
                          key={ci.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '7px 12px',
                            background: 'rgba(0,0,0,0.03)',
                            borderRadius: '8px',
                            fontSize: '0.8125rem',
                          }}
                        >
                          <span style={{ color: '#374151', fontWeight: 500 }} className="truncate">
                            {ci.agent.displayName}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                            <Star size={11} fill="#f59e0b" color="#f59e0b" />
                            <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                              {Number(ci.agent.rating).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    style={{
                      paddingTop: '16px',
                      borderTop: '1px solid rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>
                      by {col.creator.name || 'Creator'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#6a5acd',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      className="group-hover:gap-2 transition-all"
                    >
                      View <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
