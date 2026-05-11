'use client';

import { useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

export function DashboardSearch({ initialQ }: { initialQ: string }) {
  const [q, setQ] = useState(initialQ);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (value: string) => {
    setQ(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const p = new URLSearchParams(searchParams.toString());
      value.trim() ? p.set('q', value.trim()) : p.delete('q');
      router.push(`${pathname}${p.toString() ? `?${p}` : ''}`);
    }, 300);
  };

  return (
    <div style={{ position: 'relative' }}>
      <Search
        size={13}
        style={{
          position: 'absolute', left: '10px', top: '50%',
          transform: 'translateY(-50%)',
          color: '#9ca3af', pointerEvents: 'none',
        }}
      />
      <input
        type="text"
        value={q}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search agents…"
        className="dash-search"
        style={{
          padding: '7px 12px 7px 30px',
          borderRadius: '8px',
          border: '1px solid rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.6)',
          color: '#111827',
          fontSize: '0.8125rem',
          width: '200px',
          transition: 'border 0.15s',
        }}
      />
    </div>
  );
}
