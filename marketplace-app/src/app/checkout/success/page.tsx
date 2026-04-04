'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const confirmPurchase = async () => {
      try {
        // Simulate the webhook callback
        // In production, Stripe calls the webhook independently
        // Here, we trigger it manually to complete the mock flow
        const res = await fetch('/api/webhooks/stripe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'checkout.session.completed',
            data: {
              object: {
                id: sessionId,
              },
            },
          }),
        });

        if (res.ok) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Error confirming purchase:', error);
        setStatus('error');
      }
    };

    confirmPurchase();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        {status === 'processing' && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Processing Payment...</h2>
            <p className="text-gray-500 mt-2">Please wait while we confirm your purchase.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Purchase Successful!</h2>
            <p className="text-gray-500 mt-2 mb-6">You now have a license to use this agent.</p>
            <div className="flex gap-4">
              <Button onClick={() => router.push('/dashboard/buyer')}>
                Go to Dashboard
              </Button>
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
            <p className="text-gray-500 mt-2 mb-6">We couldn't confirm your purchase. Please contact support.</p>
            <Button onClick={() => router.push('/marketplace')}>
              Back to Marketplace
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
