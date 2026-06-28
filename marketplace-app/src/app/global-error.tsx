'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Something went wrong</h2>
        <p style={{ marginTop: '8px', color: '#6b7280', fontSize: '0.9rem' }}>
          An unexpected error occurred. Please try again.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block', marginTop: '20px', padding: '10px 22px',
            borderRadius: '999px', background: '#6a5acd', color: '#fff',
            fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
          }}
        >
          Back to home
        </a>
      </body>
    </html>
  );
}
