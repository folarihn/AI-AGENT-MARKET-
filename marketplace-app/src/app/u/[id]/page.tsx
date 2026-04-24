import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

function canUseDb() {
  return Boolean(process.env.DATABASE_URL);
}

function formatDate(iso: Date) {
  return iso.toISOString().slice(0, 10);
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

  const items =
    user.role === 'CREATOR'
      ? await prisma.agent.findMany({
          where: { creatorId: user.id, status: 'PUBLISHED' },
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            slug: true,
            displayName: true,
            description: true,
            itemType: true,
            price: true,
            rating: true,
            reviewsCount: true,
            updatedAt: true,
          },
        })
      : [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name || 'User'}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                {user.role}
              </span>
              <span className="text-gray-500">Joined {formatDate(user.createdAt)}</span>
              {user.emailVerified ? (
                <span className="text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-md text-xs font-medium">
                  Email verified
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/marketplace"
              className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Browse marketplace
            </Link>
          </div>
        </div>
      </div>

      {user.role === 'CREATOR' ? (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Published items</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Link key={item.id} href={`/agent/${item.slug}`} className="group">
                <div className="h-full rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600">
                        {item.displayName}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 line-clamp-2">{item.description}</div>
                    </div>
                    <span className="shrink-0 inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      {item.itemType === 'SKILL' ? 'Skill' : 'Agent'}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="text-gray-500">
                      {Number(item.rating).toFixed(1)} · {item.reviewsCount} reviews
                    </div>
                    <div className="font-semibold text-gray-900">{Number(item.price) === 0 ? 'Free' : `$${item.price}`}</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">Updated {formatDate(item.updatedAt)}</div>
                </div>
              </Link>
            ))}
          </div>

          {items.length === 0 ? (
            <div className="mt-4 text-sm text-gray-500">No published items yet.</div>
          ) : null}
        </div>
      ) : (
        <div className="mt-8 text-sm text-gray-500">This user has no public listings.</div>
      )}
    </div>
  );
}

