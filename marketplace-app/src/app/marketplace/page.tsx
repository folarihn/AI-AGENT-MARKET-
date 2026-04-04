'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MOCK_AGENTS } from '@/data/mock';
import { Button } from '@/components/ui/button';
import { Search, ShieldCheck, Star } from 'lucide-react';

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredAgents = MOCK_AGENTS.filter((agent) => {
    const matchesSearch =
      agent.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || agent.category === selectedCategory;
    const isPublished = agent.status === 'PUBLISHED';
    return matchesSearch && matchesCategory && isPublished;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Browse Agents</h1>
        <div className="flex w-full md:w-auto gap-4">
          <div className="relative flex-grow md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="all">All Categories</option>
            <option value="dev-tools">Dev Tools</option>
            <option value="content">Content</option>
            <option value="data">Data</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <Link href={`/agent/${agent.slug}`} key={agent.id} className="group">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 h-full flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center text-xl font-bold text-indigo-700">
                  {agent.displayName.charAt(0)}
                </div>
                {agent.verified && (
                  <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Verified
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600">
                {agent.displayName}
              </h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">
                {agent.description}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500 mt-auto pt-4 border-t border-gray-100">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="font-medium text-gray-900">{agent.rating}</span>
                  <span className="mx-1">·</span>
                  <span>{agent.reviewsCount} reviews</span>
                </div>
                <div className="font-bold text-gray-900">
                  {agent.price === 0 ? 'Free' : `$${agent.price}`}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No agents found matching your criteria.</p>
          <Button
            variant="link"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
