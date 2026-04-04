'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Check } from 'lucide-react';
import { MOCK_AGENTS, Agent } from '@/data/mock';

export default function CreatorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'dev-tools',
    price: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!user || user.role !== 'CREATOR') {
    return <div className="p-8 text-center">Access Denied. Creator role required.</div>;
  }

  const myAgents = MOCK_AGENTS.filter((a) => a.creatorId === user.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const form = e.target as HTMLFormElement;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) {
      setError('Please select a file to upload.');
      setIsSubmitting(false);
      return;
    }

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('creatorId', user.id);
    uploadData.append('creatorName', user.name);
    uploadData.append('metadata', JSON.stringify({
      displayName: formData.name,
      description: formData.description,
      category: formData.category,
      price: formData.price,
    }));

    try {
      const res = await fetch('/api/agents/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess('Agent uploaded successfully! Redirecting...');
      setTimeout(() => {
        setActiveTab('list');
        setSuccess(null);
        // In a real app, we would re-fetch the list here
        window.location.reload(); 
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
        {activeTab === 'list' && (
          <Button onClick={() => setActiveTab('create')}>
            <Plus className="h-4 w-4 mr-2" />
            New Agent
          </Button>
        )}
      </div>

      {activeTab === 'list' ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {myAgents.length > 0 ? (
              myAgents.map((agent) => (
                <li key={agent.id}>
                  <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        {agent.displayName.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-indigo-600 truncate">
                          {agent.displayName}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              agent.status === 'PUBLISHED'
                                ? 'bg-green-100 text-green-800'
                                : agent.status === 'PENDING_REVIEW'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {agent.status.replace('_', ' ')}
                          </span>
                          <span className="ml-2">• v{agent.version}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                       <span className="text-sm text-gray-500">{agent.downloads} downloads</span>
                       <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-8 text-center text-gray-500">
                You haven't submitted any agents yet.
              </li>
            )}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow sm:rounded-lg p-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Submit New Agent</h2>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Display Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                required
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="dev-tools">Dev Tools</option>
                  <option value="content">Content</option>
                  <option value="data">Data</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex justify-center items-center">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    <span>Upload Agent Package (.zip)</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".zip" />
                  </label>
                </div>
                <p className="text-xs text-gray-500">Must contain agent.json</p>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="ghost" onClick={() => setActiveTab('list')} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Uploading...' : 'Submit for Review'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
