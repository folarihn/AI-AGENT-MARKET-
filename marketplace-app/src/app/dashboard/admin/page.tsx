'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MOCK_AGENTS, Agent } from '@/data/mock';
import { Button } from '@/components/ui/button';
import { Check, X, Eye, ShieldAlert, ShieldCheck } from 'lucide-react';

interface ScanResult {
    malwareClean: boolean;
    secretsFound: string[];
    disallowedFiles: string[];
    status: 'PASS' | 'FAIL';
}

export default function AdminDashboard() {
  const { user } = useAuth();
  // In a real app, fetch from API. For now using mock + state to simulate updates
  const [agents, setAgents] = useState<Agent[]>([]);
  const [scans, setScans] = useState<Record<string, ScanResult>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching pending agents
    const pending = MOCK_AGENTS.filter((a) => a.status === 'PENDING_REVIEW');
    setAgents(pending);
    
    // Simulate fetching scans for each agent
    const fetchScans = async () => {
        const newScans: Record<string, ScanResult> = {};
        for (const agent of pending) {
            try {
                // Try to fetch real scan if exists (from our new API)
                const res = await fetch(`/api/admin/review?agentId=${agent.id}`);
                const data = await res.json();
                if (data.scan) {
                    newScans[agent.id] = data.scan;
                } else {
                    // Fallback mock scan result
                    newScans[agent.id] = {
                        malwareClean: true,
                        secretsFound: [],
                        disallowedFiles: [],
                        status: 'PASS'
                    };
                }
            } catch (e) {
                console.error("Failed to fetch scan", e);
            }
        }
        setScans(newScans);
        setLoading(false);
    };

    fetchScans();
  }, []);

  if (!user || user.role !== 'ADMIN') {
    return <div className="p-8 text-center">Access Denied. Admin role required.</div>;
  }

  const handleReview = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
        const res = await fetch('/api/admin/review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agentId: id,
                action,
                adminId: user.id,
                reason: action === 'REJECT' ? 'Admin rejection' : undefined
            })
        });
        
        if (res.ok) {
            alert(`Agent ${action === 'APPROVE' ? 'Approved' : 'Rejected'} successfully`);
            setAgents(agents.filter(a => a.id !== id)); // Remove from list
        } else {
            alert('Action failed');
        }
    } catch (e) {
        alert('Error performing action');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Review Queue ({agents.length})
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Agents waiting for manual review.
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {agents.length > 0 ? (
            agents.map((agent) => {
              const scan = scans[agent.id];
              return (
              <li key={agent.id} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-lg font-medium text-indigo-600 truncate">
                          {agent.displayName}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending Review
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:gap-6 text-sm text-gray-500">
                           <span>Creator: {agent.creatorName}</span>
                           <span>Version: {agent.version}</span>
                           <span>Category: {agent.category}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">{agent.description}</p>
                    </div>
                    
                    <div className="ml-5 flex-shrink-0 flex gap-2 flex-col sm:flex-row">
                        <Button variant="outline" size="sm" onClick={() => window.location.href = `/agent/${agent.slug}`}>
                        <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleReview(agent.id, 'APPROVE')}
                        >
                        <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReview(agent.id, 'REJECT')}
                        >
                        <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                    </div>
                  </div>

                  {/* Scan Results Section */}
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200 text-sm">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        {scan?.status === 'PASS' ? (
                            <ShieldCheck className="h-4 w-4 text-green-600 mr-2" />
                        ) : (
                            <ShieldAlert className="h-4 w-4 text-red-600 mr-2" />
                        )}
                        Security Scan Results
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`flex items-center ${scan?.malwareClean ? 'text-green-700' : 'text-red-700'}`}>
                            <div className={`h-2 w-2 rounded-full mr-2 ${scan?.malwareClean ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            Malware: {scan?.malwareClean ? 'Clean' : 'Detected!'}
                        </div>
                        <div className={`flex items-center ${scan?.secretsFound?.length === 0 ? 'text-green-700' : 'text-red-700'}`}>
                            <div className={`h-2 w-2 rounded-full mr-2 ${scan?.secretsFound?.length === 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            Secrets: {scan?.secretsFound?.length === 0 ? 'None' : `${scan?.secretsFound?.length} Found`}
                        </div>
                        <div className={`flex items-center ${scan?.disallowedFiles?.length === 0 ? 'text-green-700' : 'text-red-700'}`}>
                            <div className={`h-2 w-2 rounded-full mr-2 ${scan?.disallowedFiles?.length === 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            Files: {scan?.disallowedFiles?.length === 0 ? 'OK' : `${scan?.disallowedFiles?.length} Disallowed`}
                        </div>
                    </div>

                    {(scan?.secretsFound?.length > 0 || scan?.disallowedFiles?.length > 0) && (
                        <div className="mt-2 p-2 bg-red-50 text-red-800 rounded border border-red-100 text-xs font-mono">
                            {scan.secretsFound.map((s, i) => <div key={`s-${i}`}>⚠️ Secret: {s}</div>)}
                            {scan.disallowedFiles.map((f, i) => <div key={`f-${i}`}>🚫 Disallowed: {f}</div>)}
                        </div>
                    )}
                  </div>
                </div>
              </li>
            )})
          ) : (
            <li className="px-4 py-8 text-center text-gray-500">
              No agents pending review.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
