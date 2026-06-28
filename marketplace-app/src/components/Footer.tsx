'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const cols: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Marketplace',
    links: [
      { label: 'Browse all', href: '/marketplace' },
      { label: 'Agents', href: '/marketplace?itemType=AGENT' },
      { label: 'Skills', href: '/marketplace?itemType=SKILL' },
      { label: 'Collections', href: '/collections' },
    ],
  },
  {
    heading: 'For creators',
    links: [
      { label: 'Submit an agent', href: '/dashboard/creator/submit' },
      { label: 'Submission guidelines', href: '/submit-guidelines' },
      { label: 'Request a custom build', href: '/custom-requests' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Security & scanning', href: '/security' },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  // Hide on the app-shell pages that have their own full-height layout.
  if (pathname === '/marketplace' || pathname?.startsWith('/dashboard')) return null;

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white/70">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="text-lg font-extrabold tracking-tight text-gray-900 no-underline">
              AgentMarket<span className="text-indigo-600">.</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-gray-500">
              Buy, sell, and run verified AI agents and skills — every package security-scanned before it goes live.
            </p>
          </div>

          {cols.map((col) => (
            <div key={col.heading}>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">{col.heading}</div>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-gray-600 no-underline hover:text-indigo-600">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-gray-100 pt-6 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} AgentMarket. All rights reserved.</span>
          <span>Payments in USDC on Arc Testnet.</span>
        </div>
      </div>
    </footer>
  );
}
