import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/AppProviders';

export const metadata: Metadata = {
  title: 'AI Agent Marketplace',
  description: 'Buy, sell, and run verified AI agents.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
