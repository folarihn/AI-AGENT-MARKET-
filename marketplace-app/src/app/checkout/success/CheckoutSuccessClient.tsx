'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [status] = useState<'success' | 'error'>(() => (sessionId ? 'success' : 'error'));

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Purchase Successful!</h2>
            <p className="text-gray-500 mt-2 mb-6">Your purchase is complete. Your license will be issued via webhook.</p>
            <div className="flex gap-4">
              <Button onClick={() => router.push('/marketplace')}>Back to Marketplace</Button>
              <Button variant="outline" onClick={() => router.push('/marketplace')}>
                Browse More
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
            <p className="text-gray-500 mt-2 mb-6">We could not confirm your purchase. Please contact support.</p>
            <Button onClick={() => router.push('/marketplace')}>Back to Marketplace</Button>
          </div>
        )}
      </div>
    </div>
  );
}
