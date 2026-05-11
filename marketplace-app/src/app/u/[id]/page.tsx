import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ShieldCheck, Star, Package, Download, Calendar, ArrowRight } from 'lucide-react';

function canUseDb() {
  return Boolean(process.env.DATABASE_URL);
}

function formatDate(iso: Date) {
  return iso.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  if (!canUseDb()) {
    return <div className="p-8 text-center text-gray-500">Database not configured.</div>;
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      role: true,
      createdAt: true,
      emailVerified: true,
    },
  });

  if (!user) notFound();

  const isCreator = user.role === 'CREATOR' || user.role === 'ADMIN';

  const [items, collections] = await Promise.all([
    isCreator
      ? prisma.agent.findMany({
          where: { creatorId: user.id, status: 'PUBLISHED' },
          orderBy: { downloads: 'desc' },
          select: {
            id: true,
            slug: true,
            displayName: true,
            description: true,
            itemType: true,
            price: true,
            rating: true,
            reviewsCount: true,
            downloads: true,
            verified: true,
            updatedAt: true,
            category: true,
          },
        })
      : Promise.resolve([]),
    isCreator
      ? prisma.collection.findMany({
          where: { creatorId: user.id, isPublished: true },
          include: { _count: { select: { items: true } } },
          orderBy: { updatedAt: 'desc' },
          take: 4,
        })
      : Promise.resolve([]),
  ]);

  const agents = items.filter((i) => i.itemType === 'AGENT');
  const skills = items.filter((i) => i.itemType === 'SKILL');
  const totalDownloads = items.reduce((s, i) => s + i.downloads, 0);
  const avgRating =
    items.length > 0
      ? (items.reduce((s, i) => s + Number(i.rating), 0) / items.length).toFixed(1)
      : null;

  return (
    <div className="hero-gradient min-h-screen pb-16">
      {/* ── Profile header ── */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', paddingTop: '80px', paddingBottom: '0' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ paddingBottom: '40px' }}>
            {/* Avatar + name */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '22px',
                  background: 'rgba(255,255,255,0.15)',
                  border: '3px solid rgba(255,255,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.25rem',
                  fontWeight: 800,
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
                    {user.name || 'User'}
                  </h1>
                  {isCreator && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#c4b5fd',
                        background: 'rgba(196,181,253,0.15)',
                        border: '1px solid rgba(196,181,253,0.3)',
                        borderRadius: '20px',
                        padding: '3px 10px',
                      }}
                    >
                      Creator
                    </span>
                  )}
                  {user.emailVerified && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#86efac' }}>
                      <ShieldCheck size={13} /> Verified
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                  <Calendar size={13} />
                  <span>Member since {formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            {isCreator && items.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '32px',
                  marginTop: '32px',
                  paddingTop: '28px',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  flexWrap: 'wrap',
                }}
              >
                {[
                  { label: 'Published', value: items.length },
                  { label: 'Agents', value: agents.length },
                  { label: 'Skills', value: skills.length },
                  { label: 'Downloads', value: totalDownloads.toLocaleString() },
                  ...(avgRating ? [{ label: 'Avg Rating', value: `★ ${avgRating}` }] : []),
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>{s.value}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {!isCreator ? (
          <div className="text-center py-16 text-gray-500">This user has no public listings.</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No published items yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {/* Collections */}
            {collections.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
                    Collections
                  </h2>
                  <Link href="/collections" style={{ fontSize: '0.875rem', color: '#6a5acd', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Browse all <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {collections.map((col) => (
                    <Link key={col.id} href={`/collections/${col.slug}`} className="no-underline group">
                      <div
                        style={{
                          background: 'rgba(255,255,255,0.7)',
                          backdropFilter: 'blur(12px)',
                          borderRadius: '16px',
                          border: '1px solid rgba(255,255,255,0.6)',
                          padding: '20px 24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                          transition: 'box-shadow 0.2s',
                        }}
                        className="hover:shadow-md"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <Package size={18} style={{ color: '#6a5acd', flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontWeight: 700, color: '#111827', fontSize: '0.9375rem' }} className="truncate">{col.name}</p>
                            <p style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>{col._count.items} items</p>
                          </div>
                        </div>
                        <ArrowRight size={16} style={{ color: '#9ca3af', flexShrink: 0 }} className="group-hover:text-indigo-500 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Agents */}
            {agents.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: '20px' }}>
                  Agents
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {agents.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: '20px' }}>
                  Skills
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {skills.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ItemCard({
  item,
}: {
  item: {
    slug: string;
    displayName: string;
    description: string;
    itemType: string;
    price: unknown;
    rating: unknown;
    reviewsCount: number;
    downloads: number;
    verified: boolean;
    updatedAt: Date;
  };
}) {
  const price = Number(item.price);
  const rating = Number(item.rating);

  return (
    <Link href={`/agent/${item.slug}`} className="no-underline group">
      <div
        className="h-full flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        style={{
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '18px',
          border: '1px solid rgba(255,255,255,0.6)',
          padding: '20px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: item.itemType === 'SKILL' ? 'rgba(124,58,237,0.08)' : 'rgba(106,90,205,0.08)',
              color: item.itemType === 'SKILL' ? '#7c3aed' : '#6a5acd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.125rem',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {item.displayName.charAt(0)}
          </div>
          {item.verified && <ShieldCheck size={15} style={{ color: '#10b981' }} />}
        </div>

        <h3
          style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', marginBottom: '4px' }}
          className="line-clamp-1"
        >
          {item.displayName}
        </h3>
        <p
          style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.5, flexGrow: 1, marginBottom: '14px' }}
          className="line-clamp-2"
        >
          {item.description}
        </p>

        <div
          style={{
            paddingTop: '12px',
            borderTop: '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.8125rem' }}>
              <Star size={12} fill="#f59e0b" color="#f59e0b" />
              <span style={{ fontWeight: 700, color: '#111827' }}>{rating.toFixed(1)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: '#9ca3af' }}>
              <Download size={11} />
              <span>{item.downloads}</span>
            </div>
          </div>
          <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#111827' }}>
            {price === 0 ? 'Free' : `$${price}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
