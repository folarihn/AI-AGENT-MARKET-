import { auth } from '@/auth';
import { redirect } from 'next/navigation';
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
      <CreatorAnalyticsClient data={data} />
    </div>
  );
}
