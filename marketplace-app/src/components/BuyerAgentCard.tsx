'use client';

import { Button } from '@/components/ui/button';
import { Download, BadgeAlert } from 'lucide-react';
import Link from 'next/link';

export type BuyerCardAgent = {
  id: string;
  displayName: string;
  version: string;
  creatorName: string;
  updatedAt: string;
};

export type BuyerAgentCardProps = {
  agent: BuyerCardAgent;
  purchaseDate: string;
  updatedSincePurchase: boolean;
};

export function BuyerAgentCard({ agent, purchaseDate, updatedSincePurchase }: BuyerAgentCardProps) {
  const downloadHref = `/api/agents/${agent.id}/download`;
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{agent.displayName}</h3>
          {updatedSincePurchase && (
            <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-2 py-1 text-xs font-medium">
              <BadgeAlert className="h-3 w-3 mr-1" />
              Updated
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">v{agent.version} • by {agent.creatorName}</p>
        <p className="text-xs text-gray-500 mt-2">Purchased on {new Date(purchaseDate).toLocaleDateString()}</p>
      </div>
      <div className="mt-4">
        <Link href={downloadHref}>
          <Button className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </Link>
      </div>
    </div>
  );
}
