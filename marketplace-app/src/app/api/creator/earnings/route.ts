import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'CREATOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const perCallSkills = await db.agents.findMany({
      where: {
        creatorId: session.user.id,
        itemType: 'SKILL' as const,
        pricingModel: 'PER_CALL',
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        pricePerCall: true,
        pricingModel: true,
      },
    });

    const earningsData = await Promise.all(
      perCallSkills.map(async (skill) => {
        const usageStats = await db.skillUsage.getBySkill(skill.id);
        const lifetimeEarnings = await db.usagePayment.getBySkill(skill.id);

        return {
          skillId: skill.id,
          name: skill.displayName || skill.name,
          pricePerCall: skill.pricePerCall ? Number(skill.pricePerCall) : 0,
          lifetimeCalls: usageStats.totalCalls,
          lifetimeUSDC: lifetimeEarnings,
        };
      })
    );

    return NextResponse.json({ earnings: earningsData });
  } catch (error) {
    console.error('Failed to fetch earnings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}