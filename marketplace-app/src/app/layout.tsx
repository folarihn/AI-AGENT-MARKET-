import type { Metadata } from 'next';
import './globals.css';
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
    <html lang="en">
      <body>
        <AppProviders>
          <div className="min-h-screen flex flex-col" style={{ background: 'transparent' }}>
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <footer className="footer-glass" style={{ padding: '32px 24px' }}>
              <div
                style={{
                  maxWidth: '1100px',
                  margin: '0 auto',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                  }}
                >
                  AgentMarket<span style={{ color: '#c4b5fd' }}>.</span>
                </span>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
                  &copy; 2026 AI Agent Marketplace. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
