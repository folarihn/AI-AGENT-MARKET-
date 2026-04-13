import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import BuyerLibraryClient from '@/components/BuyerLibraryClient';

export default async function BuyerDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard/buyer');
  }
  const licenses = await db.licenses.findByUser(session.user.id);
  const items = [];
  for (const lic of licenses) {
    const agent = await db.agents.findById(lic.agentId);
    if (!agent) continue;
    const updatedSincePurchase =
      new Date(agent.updatedAt).getTime() > new Date(lic.purchasedAt).getTime();
    items.push({
      agent: {
        id: agent.id,
        displayName: agent.displayName,
        version: agent.version,
        creatorName: agent.creatorName,
        updatedAt: agent.updatedAt,
      },
      license: { createdAt: lic.purchasedAt },
      updatedSincePurchase,
    });
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Library</h1>
        <p className="text-gray-600 mt-1">Access the agents you own and download them again anytime.</p>
      </div>
      <BuyerLibraryClient items={items} />
    </div>
  );
}
