'use client';

import { useEffect, useRef, useState } from 'react';

const words = ['AI Agents', 'Skills'];

export default function FlipText() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const schedule = () => {
      timerRef.current = setTimeout(() => {
        // flip out
        setPhase('out');

        // after flip-out finishes, swap word and flip in
        timerRef.current = setTimeout(() => {
          setIndex((i) => (i + 1) % words.length);
          setPhase('in');

          // after flip-in finishes, go idle then schedule next flip
          timerRef.current = setTimeout(() => {
            setPhase('idle');
            schedule();
          }, 350);
        }, 350);
      }, 4000);
    };

    schedule();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const cls = ['flip-text', phase === 'out' ? 'flip-out' : phase === 'in' ? 'flip-in' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <span style={{ display: 'inline-block', perspective: '600px' }}>
      <span className={cls} style={{ color: '#6a5acd' }}>
        {words[index]}
      </span>
    </span>
  );
}
