import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCreatorAnalytics } from '@/lib/creatorAnalytics';
import CreatorAnalyticsClient from '@/components/CreatorAnalyticsClient';

export default async function CreatorAnalyticsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard/creator/analytics');
  }
  if (session.user.role !== 'CREATOR') {
    redirect('/marketplace');
  }

  const data = await getCreatorAnalytics(session.user.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Creator Analytics</h1>
        <p className="text-gray-600 mt-1">Track views, downloads, and revenue across your agents.</p>
      </div>
      
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <Link
            href="/dashboard/creator/analytics"
            className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Overview
          </Link>
          <Link
            href="/dashboard/creator/analytics/earnings"
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Earnings
          </Link>
        </nav>
      </div>

      <CreatorAnalyticsClient data={data} />
    </div>
  );
}
  if (session.user.role !== 'CREATOR') {
    redirect('/marketplace');
  }

  const data = await getCreatorAnalytics(session.user.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Creator Analytics</h1>
        <p className="text-gray-600 mt-1">Track views, downloads, and revenue across your agents.</p>
      </div>
      <CreatorAnalyticsClient data={data} />
    </div>
  );
}
