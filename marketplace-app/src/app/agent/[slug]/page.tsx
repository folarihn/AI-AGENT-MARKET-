'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MOCK_AGENTS } from '@/data/mock';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Download, AlertTriangle, FileText, Globe, HardDrive, ShoppingCart, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AgentDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const agent = MOCK_AGENTS.find((a) => a.slug === slug);
  
  const [hasLicense, setHasLicense] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingLicense, setCheckingLicense] = useState(true);

  useEffect(() => {
    if (user && agent) {
      // Check if user has license
      fetch(`/api/licenses/check?userId=${user.id}&agentId=${agent.id}`)
        .then(res => res.json())
        .then(data => {
          setHasLicense(data.hasLicense);
          setCheckingLicense(false);
        })
        .catch(() => setCheckingLicense(false));
    } else {
      setCheckingLicense(false);
    }
  }, [user, agent]);

  if (!agent) {
    return <div className="p-8 text-center text-red-500">Agent not found</div>;
  }

  const handleBuy = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          userId: user.id,
          price: agent.price
        })
      });
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Checkout failed');
      }
    } catch (e) {
      console.error(e);
      alert('Error initiating checkout');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
     if (!user) return;
     
     // Trigger download
     window.location.href = `/api/agents/${agent.id}/download?userId=${user.id}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold leading-6 text-gray-900 flex items-center gap-2">
              {agent.displayName}
              {agent.verified && (
                <ShieldCheck className="h-6 w-6 text-green-500" title="Verified & Scanned" />
              )}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              by {agent.creatorName} • v{agent.version} • Updated {agent.updatedAt}
            </p>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-2xl font-bold text-gray-900">
              {agent.price === 0 ? 'Free' : `$${agent.price}`}
            </span>
             
             {checkingLicense ? (
                <Button className="mt-2" disabled>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...
                </Button>
             ) : hasLicense || agent.price === 0 ? (
                <Button className="mt-2 bg-green-600 hover:bg-green-700" onClick={handleDownload} disabled={!user}>
                   <Download className="mr-2 h-4 w-4" /> Download
                </Button>
             ) : (
                <Button className="mt-2" onClick={handleBuy} disabled={isLoading || !user}>
                   {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                   ) : (
                      <><ShoppingCart className="mr-2 h-4 w-4" /> Buy Now</>
                   )}
                </Button>
             )}
             
             {!user && <p className="text-xs text-gray-500 mt-1">Login required</p>}
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <section>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{agent.description}</p>
                <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 uppercase mb-2">Readme Preview</h4>
                  <p className="text-sm text-gray-600">
                    This is where the full README.md would be rendered. It contains installation instructions, usage examples, and configuration details.
                    <br/><br/>
                    1. Install dependencies: `pip install -r requirements.txt`<br/>
                    2. Set env vars: `export OPENAI_API_KEY=...`<br/>
                    3. Run: `python main.py`
                  </p>
                </div>
              </section>

              <section>
                 <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Reviews</h3>
                 <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-gray-500 italic">No reviews yet for this version.</p>
                 </div>
              </section>
            </div>

            <div className="space-y-6">
              <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100">
                <h3 className="text-lg font-medium text-indigo-900 mb-4 flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-2" />
                  Trust & Security
                </h3>
                <ul className="space-y-3 text-sm text-indigo-800">
                  <li className="flex items-center">
                    <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                    Malware Scanned (Clean)
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                    No Secrets Found
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                    Verified Creator
                  </li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                  Permissions
                </h3>
                <div className="space-y-3">
                  {agent.permissions.network && (
                    <div className="flex items-start">
                      <Globe className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Network Access</p>
                        <p className="text-xs text-gray-500">Can connect to external APIs.</p>
                      </div>
                    </div>
                  )}
                  {agent.permissions.filesystem && (
                    <div className="flex items-start">
                      <HardDrive className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Filesystem Access</p>
                        <p className="text-xs text-gray-500">Can read/write files in project root.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                 <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">Package Info</h3>
                 <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                       <dt className="text-gray-500">Size:</dt>
                       <dd className="text-gray-900 font-medium">1.2 MB</dd>
                    </div>
                    <div className="flex justify-between">
                       <dt className="text-gray-500">License:</dt>
                       <dd className="text-gray-900 font-medium">MIT</dd>
                    </div>
                    <div className="flex justify-between">
                       <dt className="text-gray-500">Runtime:</dt>
                       <dd className="text-gray-900 font-medium">Python 3.10</dd>
                    </div>
                 </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
