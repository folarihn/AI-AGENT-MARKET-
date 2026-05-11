'use client';

import { useEffect, useRef } from 'react';

// Each orb has its own frequency + phase so they never move in sync.
// Frequencies scaled ~1.4× vs original for slightly faster feel.
const ORBS = [
  {
    size: 780,
    blur: 72,
    bg: 'radial-gradient(circle at center, rgba(196,181,253,0.32) 0%, rgba(139,92,246,0.20) 33%, rgba(109,40,217,0.10) 60%, transparent 78%)',
    x: (t: number) => 0.50 + 0.30 * Math.sin(t * 0.00053)       + 0.08 * Math.sin(t * 0.00099),
    y: (t: number) => 0.25 + 0.16 * Math.cos(t * 0.00041)       + 0.05 * Math.cos(t * 0.00077),
  },
  {
    size: 600,
    blur: 60,
    bg: 'radial-gradient(circle at center, rgba(167,139,250,0.28) 0%, rgba(124,58,237,0.18) 36%, rgba(91,33,182,0.09) 62%, transparent 80%)',
    x: (t: number) => 0.50 + 0.28 * Math.sin(t * 0.00074 + 1.6) + 0.09 * Math.sin(t * 0.00127),
    y: (t: number) => 0.40 + 0.18 * Math.cos(t * 0.00059 + 0.9) + 0.06 * Math.cos(t * 0.00097),
  },
  {
    size: 660,
    blur: 68,
    bg: 'radial-gradient(circle at center, rgba(221,214,254,0.26) 0%, rgba(196,181,253,0.16) 38%, rgba(139,92,246,0.08) 63%, transparent 80%)',
    x: (t: number) => 0.50 + 0.33 * Math.sin(t * 0.00034 + 2.8) + 0.07 * Math.sin(t * 0.00083),
    y: (t: number) => 0.32 + 0.20 * Math.cos(t * 0.00027 + 1.4) + 0.07 * Math.cos(t * 0.00057),
  },
  {
    size: 540,
    blur: 58,
    bg: 'radial-gradient(circle at center, rgba(139,92,246,0.28) 0%, rgba(109,40,217,0.18) 35%, rgba(76,29,149,0.09) 62%, transparent 80%)',
    x: (t: number) => 0.50 + 0.27 * Math.sin(t * 0.00066 + 0.5) + 0.08 * Math.sin(t * 0.00103),
    y: (t: number) => 0.38 + 0.17 * Math.cos(t * 0.00049 + 0.3) + 0.05 * Math.cos(t * 0.00082),
  },
  {
    size: 720,
    blur: 76,
    bg: 'radial-gradient(circle at center, rgba(233,213,255,0.22) 0%, rgba(216,180,254,0.13) 40%, rgba(192,132,252,0.06) 64%, transparent 80%)',
    x: (t: number) => 0.50 + 0.31 * Math.sin(t * 0.00044 + 2.0) + 0.10 * Math.sin(t * 0.00077),
    y: (t: number) => 0.30 + 0.19 * Math.cos(t * 0.00035 + 1.8) + 0.06 * Math.cos(t * 0.00062),
  },
  {
    size: 500,
    blur: 54,
    bg: 'radial-gradient(circle at center, rgba(196,181,253,0.28) 0%, rgba(124,58,237,0.18) 34%, rgba(109,40,217,0.09) 60%, transparent 78%)',
    x: (t: number) => 0.50 + 0.35 * Math.sin(t * 0.00079 + 4.0) + 0.07 * Math.sin(t * 0.00115),
    y: (t: number) => 0.35 + 0.21 * Math.cos(t * 0.00063 + 3.5) + 0.08 * Math.cos(t * 0.00094),
  },
] as const;

export default function CursorGradient() {
  const orbRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const cursorRef = useRef<HTMLDivElement>(null);

  const cursorPos    = useRef({ x: 0.5, y: 0.35 });
  const cursorTarget = useRef({ x: 0.5, y: 0.35 });
  const raf          = useRef<number>(0);

  useEffect(() => {
    const cursor = cursorRef.current;
    const orbs   = orbRefs.current;
    if (!cursor || orbs.some(o => !o)) return;

    const hero = orbs[0]!.closest('.hero-gradient') as HTMLElement | null;
    if (!hero) return;

    const onEnter = () => { cursor.style.opacity = '1'; };
    const onLeave = () => { cursor.style.opacity = '0'; };
    const onMove  = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect();
      cursorTarget.current = {
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top)  / r.height,
      };
    };

    hero.addEventListener('mouseenter', onEnter);
    hero.addEventListener('mouseleave', onLeave);
    hero.addEventListener('mousemove',  onMove);

    let lastT = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;

      // Autonomous orbs — each follows its own sine path
      ORBS.forEach((cfg, i) => {
        const el = orbs[i];
        if (!el) return;
        el.style.left = `${cfg.x(now) * 100}%`;
        el.style.top  = `${cfg.y(now) * 100}%`;
      });

      // Cursor orb — frame-rate independent lerp (~0.2 s lag)
      const a = 1 - Math.pow(0.90, dt * 60);
      cursorPos.current = {
        x: cursorPos.current.x + (cursorTarget.current.x - cursorPos.current.x) * a,
        y: cursorPos.current.y + (cursorTarget.current.y - cursorPos.current.y) * a,
      };
      cursor.style.left = `${cursorPos.current.x * 100}%`;
      cursor.style.top  = `${cursorPos.current.y * 100}%`;

      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);

    return () => {
      hero.removeEventListener('mouseenter', onEnter);
      hero.removeEventListener('mouseleave', onLeave);
      hero.removeEventListener('mousemove',  onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      {ORBS.map((cfg, i) => (
        <div
          key={i}
          ref={el => { orbRefs.current[i] = el; }}
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            top: '30%',
            width:  `${cfg.size}px`,
            height: `${cfg.size}px`,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: cfg.bg,
            filter: `blur(${cfg.blur}px)`,
            pointerEvents: 'none',
            zIndex: 0,
            willChange: 'left, top',
          }}
        />
      ))}

      {/* Cursor echo — lighter, appears only on mouse enter */}
      <div
        ref={cursorRef}
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          top: '35%',
          width: '420px',
          height: '420px',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at center, rgba(255,255,255,0.28) 0%, rgba(221,214,254,0.13) 38%, rgba(167,139,250,0.06) 62%, transparent 78%)',
          filter: 'blur(46px)',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0,
          transition: 'opacity 0.5s ease',
          willChange: 'left, top, opacity',
        }}
      />
    </>
  );
}
