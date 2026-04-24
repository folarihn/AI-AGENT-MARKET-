'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Download, CreditCard, Zap, ArrowRight, Loader2, Wallet, DollarSign } from 'lucide-react';

interface SkillInput {
  name: string;
  type: string;
  required: boolean;
  default?: unknown;
}

interface SkillOutput {
  name: string;
  type: string;
}

interface SkillPermission {
  network: boolean;
  filesystem: boolean;
  subprocess: boolean;
}

interface SkillDetailProps {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  creatorId: string;
  creatorName: string;
  runtime: string;
  verified: boolean;
  price: number;
  pricePerCall: number | null;
  pricingModel: 'FREE' | 'ONE_TIME' | 'PER_CALL';
  inputs: SkillInput[];
  outputs: SkillOutput[];
  tags: string[];
  readmeText?: string;
  permissions: SkillPermission;
}

interface ScanInfo {
  passed: boolean;
  malwareClean: boolean;
  secretsFound: string[];
}

function RuntimeBadge({ runtime }: { runtime: string }) {
  const labels: Record<string, string> = {
    'python3.11': 'Python',
    'node20': 'Node',
    'wasm': 'WASM',
  };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
      {labels[runtime] || runtime}
    </span>
  );
}

function PricingBadge({ model, price, pricePerCall }: { model: string; price: number; pricePerCall: number | null }) {
  if (model === 'FREE') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
        Free
      </span>
    );
  }
  if (model === 'PER_CALL' && pricePerCall) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
        ${pricePerCall.toFixed(3)}/call
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
      ${price.toFixed(2)}
    </span>
  );
}

function InterfacePanel({ 
  inputs, 
  outputs 
}: { 
  inputs: SkillInput[]; 
  outputs: SkillOutput[] 
}) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-4">Interface</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs uppercase text-gray-500 mb-2">Inputs ({inputs.length})</h4>
          <div className="space-y-2">
            {inputs.map((input, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <code className="text-green-400">{input.name}</code>
                <span className="text-gray-500">:</span>
                <span className="text-gray-400">{input.type}</span>
                {input.required && <span className="text-red-400 text-xs">required</span>}
                {input.default !== undefined && (
                  <span className="text-gray-500 text-xs">= {String(input.default)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-xs uppercase text-gray-500 mb-2">Outputs ({outputs.length})</h4>
          <div className="space-y-2">
            {outputs.map((output, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <code className="text-blue-400">{output.name}</code>
                <span className="text-gray-500">:</span>
                <span className="text-gray-400">{output.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PermissionBadge({ permissions }: { permissions: SkillPermission }) {
  const perms = [];
  if (permissions.network) perms.push('network');
  if (permissions.filesystem) perms.push('filesystem');
  if (permissions.subprocess) perms.push('subprocess');
  
  if (perms.length === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-500/20 text-gray-400">
        No permissions
      </span>
    );
  }
  
  return (
    <div className="flex gap-1">
      {perms.map((p) => (
        <span key={p} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-400">
          {p}
        </span>
      ))}
    </div>
  );
}

interface SkillDetailClientProps {
  skill: SkillDetailProps;
  scan: ScanInfo | null;
  hasLicense: boolean;
  usage: { callCount: number; usdcSpent: number } | null;
  creatorEmailVerified: boolean;
}

export default function SkillDetailClient({
  skill,
  scan,
  hasLicense,
  usage,
  creatorEmailVerified,
}: SkillDetailClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setChecking(false);
    } else {
      setChecking(false);
    }
  }, [user]);

  const handleDownload = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    window.location.href = `/api/agents/${skill.id}/download`;
  };

  const handleBuy = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: skill.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert('Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEnablePerCall = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push(`/skill/${skill.slug}/deposit`);
  };

  const isPerCall = skill.pricingModel === 'PER_CALL';
  const isFree = skill.pricingModel === 'FREE';
  const isOneTime = skill.pricingModel === 'ONE_TIME';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                SKILL
              </span>
              <RuntimeBadge runtime={skill.runtime} />
              {skill.verified && <ShieldCheck className="h-5 w-5 text-green-500" />}
            </div>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">{skill.displayName}</h1>
            <p className="mt-2 text-sm text-gray-500">
              by{' '}
              <Link href={`/u/${skill.creatorId}`} className="text-indigo-600 hover:text-indigo-700">
                {skill.creatorName}
              </Link>{' '}
              • v{skill.version} • {skill.runtime}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <PricingBadge 
                model={skill.pricingModel} 
                price={skill.price} 
                pricePerCall={skill.pricePerCall} 
              />
              {skill.tags.map((tag) => (
                <span key={tag} className="text-xs text-gray-500">#{tag}</span>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="flex flex-col gap-2">
              {checking ? (
                <Button disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...
                </Button>
              ) : isFree || hasLicense ? (
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" /> Add to agent
                </Button>
              ) : isPerCall ? (
                <Button onClick={handleEnablePerCall}>
                  <Zap className="mr-2 h-4 w-4" /> Enable skill
                </Button>
              ) : (
                <Button onClick={handleBuy} disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Buy for ${skill.price}
                </Button>
              )}
              
              {!user && <p className="text-xs text-gray-500 mt-1">Login required</p>}
              
              {usage && isPerCall && (
                <div className="mt-2 text-xs text-gray-500 text-right">
                  <div>{usage.callCount} calls this month</div>
                  <div>${usage.usdcSpent.toFixed(3)} USDC spent</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <section>
                <h2 className="text-lg leading-6 font-medium text-gray-900 mb-2">Description</h2>
                <p className="text-gray-700">{skill.description}</p>
                {skill.readmeText && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">README</h3>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{skill.readmeText}</pre>
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <InterfacePanel inputs={skill.inputs} outputs={skill.outputs} />
              
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h2 className="text-sm font-bold text-gray-700 uppercase mb-2">Security</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Scan:</span>
                    <span className={scan?.passed ? 'text-green-600' : 'text-red-600'}>
                      {scan?.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Permissions:</span>
                    <PermissionBadge permissions={skill.permissions} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Creator verified:</span>
                    <span className={creatorEmailVerified ? 'text-green-600' : 'text-gray-500'}>
                      {creatorEmailVerified ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}