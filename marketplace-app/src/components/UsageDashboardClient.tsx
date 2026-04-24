'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { CreditCard, Activity, Plus, ArrowUpRight, Loader2 } from 'lucide-react';

interface SkillUsage {
  id: string;
  skillId: string;
  skillName: string;
  callCount: number;
  usdcSpent: number;
  period: string;
}

interface UsageDashboardClientProps {
  usages: SkillUsage[];
}

export default function UsageDashboardClient({ usages: initialUsages }: UsageDashboardClientProps) {
  const { data: session } = useSession();
  const [usages, setUsages] = useState(initialUsages);
  const [loading, setLoading] = useState(false);

  const totalSpent = usages.reduce((sum, u) => sum + u.usdcSpent, 0);
  const totalCalls = usages.reduce((sum, u) => sum + u.callCount, 0);

  const groupedBySkill = usages.reduce((acc, u) => {
    if (!acc[u.skillId]) {
      acc[u.skillId] = { name: u.skillName, calls: 0, spent: 0 };
    }
    acc[u.skillId].calls += u.callCount;
    acc[u.skillId].spent += u.usdcSpent;
    return acc;
  }, {} as Record<string, { name: string; calls: number; spent: number }>);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Usage Dashboard</h1>
        <p className="text-gray-500 mt-1">Track your per-call skill usage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Calls</p>
              <p className="text-3xl font-bold text-gray-900">{totalCalls}</p>
            </div>
            <Activity className="h-8 w-8 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total USDC Spent</p>
              <p className="text-3xl font-bold text-gray-900">${totalSpent.toFixed(3)}</p>
            </div>
            <CreditCard className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Skills</p>
              <p className="text-3xl font-bold text-gray-900">{Object.keys(groupedBySkill).length}</p>
            </div>
            <Plus className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Usage by Skill</h2>
        </div>

        {usages.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No skill usage yet</p>
            <Link href="/marketplace">
              <Button className="mt-4">
                Browse skills <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {Object.entries(groupedBySkill).map(([skillId, stats]) => (
              <div key={skillId} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <Link href={`/skill/${skillId}`} className="font-medium text-gray-900 hover:text-indigo-600">
                    {stats.name}
                  </Link>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-sm">
                    <span className="text-gray-500">{stats.calls} calls</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    ${stats.spent.toFixed(3)} USDC
                  </div>
                  <Link href={`/skill/${skillId}/deposit`}>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-1 h-4 w-4" /> Top up
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}