'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Eye, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Prisma } from '@prisma/client';

interface SkillAsset {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  status: string;
  pricingModel: string;
  price: Prisma.Decimal;
  pricePerCall: Prisma.Decimal | null;
  runtime: string | null;
  inputs: unknown;
  outputs: unknown;
  permissionsNetwork: boolean;
  permissionsFilesystem: boolean;
  permissionsSubprocess: boolean;
  creatorName: string;
  creatorId: string;
}

interface SkillOutput {
  name: string;
  type: string;
}

interface SkillInput {
  name: string;
  type: string;
  required: boolean;
  default?: unknown;
}

interface ScanResult {
  malwareClean: boolean;
  secretsFound: string[];
  disallowedFiles: string[];
  status: 'PASS' | 'FAIL';
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [assets, setAssets] = useState<SkillAsset[]>([]);
  const [scans, setScans] = useState<Record<string, ScanResult>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'AGENT' | 'SKILL'>('ALL');
  const [pricingFilter, setPricingFilter] = useState<'ALL' | 'FREE' | 'ONE_TIME' | 'PER_CALL'>('ALL');

  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    if (!isAdmin) return;
    
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/queue');
        if (res.ok) {
          const data = await res.json();
          setAssets(data.assets || []);
          setScans(data.scans || {});
        }
      } catch (e) {
        console.error("Failed to fetch queue", e);
      }
      setLoading(false);
    };

    load();
  }, [isAdmin]);

  const filteredAssets = assets.filter((asset) => {
    if (filter !== 'ALL' && asset.status !== 'PENDING_REVIEW') return false;
    if (filter !== 'ALL' && asset.status !== 'PENDING_REVIEW') return false;
    if (filter !== 'ALL' && asset.status !== 'PENDING_REVIEW') return false;
    if (filter !== 'ALL' && asset.status !== 'PENDING_REVIEW') return false;
    return true;
  });

  const handleReview = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch('/api/admin/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: id,
          action,
          reason: action === 'REJECT' ? 'Admin rejection' : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Asset ${action === 'APPROVE' ? 'Approved' : 'Rejected'}`);
        if (action === 'APPROVE' && data.escrowRegistrationFailed) {
          alert('Warning: Escrow registration failed. Use retry endpoint.');
        }
        setAssets((prev) => prev.filter((a) => a.id !== id));
      } else {
        alert('Action failed');
      }
    } catch {
      alert('Error performing action');
    }
  };

  if (status === 'loading') return <div className="p-8 text-center">Loading...</div>;
  if (!isAdmin) return <div className="p-8 text-center">Access Denied. Admin role required.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      <div className="flex gap-2 mb-6">
        {(['ALL', 'AGENT', 'SKILL'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              filter === f 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Review Queue ({assets.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          </div>
        ) : assets.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            No assets pending review.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {assets.map((asset) => {
              const scan = scans[asset.id];
              const isSkill = asset.status === 'PENDING_REVIEW' && asset.pricingModel;
              const runtime = asset.runtime as string | null;
              const inputs = asset.inputs as SkillInput[] | null;
              const outputs = asset.outputs as SkillOutput[] | null;
              const isPerCall = asset.pricingModel === 'PER_CALL';
              const pricePerCall = asset.pricePerCall ? Number(asset.pricePerCall) : 0;

              return (
                <li key={asset.id} className="p-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                            isSkill ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {isSkill ? 'SKILL' : 'AGENT'}
                          </span>
                          <p className="text-lg font-medium text-gray-900">
                            {asset.displayName}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                          <span>Creator: {asset.creatorName}</span>
                          <span>Version: {asset.version}</span>
                          {runtime && <span>Runtime: {runtime}</span>}
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            asset.pricingModel === 'FREE' ? 'bg-green-100 text-green-700' :
                            asset.pricingModel === 'PER_CALL' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {asset.pricingModel === 'FREE' ? 'Free' :
                             asset.pricingModel === 'PER_CALL' ? `$${pricePerCall.toFixed(3)}/call` :
                             `$${Number(asset.price)}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.location.href = isSkill ? `/skill/${asset.name}` : `/agent/${asset.name}`}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        <Button variant="default" size="sm" className="bg-green-600" onClick={() => handleReview(asset.id, 'APPROVE')}>
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleReview(asset.id, 'REJECT')}>
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>

                    {isSkill && inputs && inputs.length > 0 && (
                      <div className="bg-purple-50 p-3 rounded-md border border-purple-200">
                        <h4 className="font-semibold text-purple-900 mb-2 text-sm">Interface</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-purple-700 font-medium">Inputs:</span>
                            {inputs.map((inp, i) => (
                              <div key={i} className="ml-2 text-gray-600">
                                {inp.name} ({inp.type}){inp.required ? ' *' : ''}
                              </div>
                            ))}
                          </div>
                          <div>
                            <span className="text-purple-700 font-medium">Outputs:</span>
                            {outputs?.map((out, i) => (
                              <div key={i} className="ml-2 text-gray-600">
                                {out.name} ({out.type})
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {isPerCall && (
                      <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 text-sm text-yellow-800">
                        ⚠️ Approving this PER_CALL skill will auto-register it in the escrow contract.
                        Price: ${pricePerCall.toFixed(3)}/call
                      </div>
                    )}

                    {scan && (
                      <div className="bg-gray-50 p-3 rounded-md border border-gray-200 text-sm">
                        <div className="flex items-center gap-2">
                          {scan.status === 'PASS' ? (
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                          ) : (
                            <ShieldAlert className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-semibold">Scan: {scan.status}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}