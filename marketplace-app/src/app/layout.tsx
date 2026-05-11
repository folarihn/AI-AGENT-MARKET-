import type { Metadata } from 'next';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { AppProviders } from '@/components/AppProviders';
import { Navbar } from '@/components/Navbar';

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
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProviders>
          <div className="min-h-screen flex flex-col" style={{ background: 'transparent' }}>
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
