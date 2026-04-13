import { Suspense } from 'react';
import CheckoutSuccessClient from './CheckoutSuccessClient';

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <CheckoutSuccessClient />
    </Suspense>
  );
}
