import Link from 'next/link';
import CursorGradient from '@/components/CursorGradient';
import { HeroConnectButton } from '@/components/HeroConnectButton';
import {
  ShieldCheck,
  Search,
  Download,
  Play,
  Code,
  FileText,
  Database,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Globe,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen hero-gradient">
      <CursorGradient />
      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section style={{ paddingTop: '160px', paddingBottom: '100px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative' }}>



          {/* Trust badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div className="trust-badge">
              <ShieldCheck size={14} style={{ color: 'var(--accent)' }} />
              <span>100% Malware Scanned &amp; Verified</span>
            </div>
          </div>

          {/* Headline */}
          <h1
            className="hero-headline"
            style={{
              fontSize: '4.5rem',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              color: '#2c3e50',
              marginBottom: '16px',
            }}
          >
            Safe, Verified <span style={{ color: '#6a5acd' }}>AI Agents</span>
            <br />
            for your Workflow<span style={{ color: '#6a5acd' }}>.</span>
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontSize: '1.25rem',
              color: '#7f8c8d',
              fontWeight: 300,
              maxWidth: '600px',
              margin: '0 auto 40px',
              lineHeight: 1.5,
            }}
          >
            Discover, buy, and install standardized AI agents.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <HeroConnectButton />
            <Link href="/dashboard/creator" className="btn-secondary">
              Submit an Agent
              <span className="btn-icon">
                <Code size={14} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ CATEGORIES — TIMELINE CARDS ═══════════════ */}
      <section id="how-it-works" style={{ padding: '0 24px 80px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <div className="timeline-container" style={{ flexWrap: 'wrap' }}>
          {/* Left panel — timeline */}
          <div className="timeline-left" style={{ minWidth: '300px', flex: '1.2' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', color: '#111827', letterSpacing: '-0.02em' }}>
              How it Works
            </h3>
            {/* Step 1 */}
            <div className="timeline-item">
              <div className="timeline-dot" style={{ background: '#ffffff' }}>
                <img src="/loupe.png" alt="Discover" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
              </div>
              <div className="timeline-content" style={{ flex: 1 }}>
                <h4>1. Discover</h4>
                <p>Find the perfect agent for your task. Read reviews and verify permissions.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="timeline-item">
              <div className="timeline-dot" style={{ background: '#ffffff' }}>
                <img src="/download_icon.png" alt="Download" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
              </div>
              <div className="timeline-content" style={{ flex: 1 }}>
                <h4>2. Download</h4>
                <p>Get the standardized agent package. Secure and signed.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="timeline-item">
              <div className="timeline-dot" style={{ background: '#ffffff' }}>
                <img src="/play_icon.png" alt="Run Locally" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
              </div>
              <div className="timeline-content" style={{ flex: 1 }}>
                <h4>3. Run Locally</h4>
                <p>Install and run on your machine. You keep control of your data.</p>
              </div>
            </div>
          </div>

          {/* Right panel — feature showcase card */}
          <div
            style={{
              flex: '0.8',
              minWidth: '280px',
              background: 'linear-gradient(145deg, #1e1b4b, #312e81)',
              borderRadius: '24px',
              padding: '28px',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 20px 60px rgba(30, 27, 75, 0.25)',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px',
                }}
              >
                <span style={{ fontSize: '1.0625rem', fontWeight: 700 }}>
                  Backy's Spotlight
                </span>
              </div>

              <div
                style={{
                  width: '100%',
                  height: '180px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <img
                  src="/spotlight.png"
                  alt="Backy's Spotlight"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>from</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>$4.99</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                }}
              >
                <ShieldCheck size={16} style={{ opacity: 0.7 }} />
                <span style={{ fontSize: '0.8125rem', opacity: 0.85 }}>Security Verified</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                }}
              >
                <Download size={16} style={{ opacity: 0.7 }} />
                <span style={{ fontSize: '0.8125rem', opacity: 0.85 }}>Instant Download</span>
              </div>
            </div>
          </div>
        </div>


      </section>



      {/* ═══════════════ SKILLS VS AGENTS SECTION ═══════════════ */}
      <section style={{ padding: '0 24px 80px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            borderRadius: '24px',
            padding: '48px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: '8px' }}>
              Skills are the building blocks<span style={{ color: 'var(--accent)' }}>.</span> Agents are what you ship<span style={{ color: 'var(--accent)' }}>.</span>
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
              Discover exactly what you need, whether it's a full workflow or a modular capability.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {/* Skills Card */}
            <div style={{ flex: '1', minWidth: '300px', background: 'rgba(255,255,255,0.7)', borderRadius: '16px', padding: '32px', border: '1px solid rgba(255,255,255,0.8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', background: 'rgba(106, 90, 205, 0.05)', borderRadius: '16px', border: '1px solid rgba(106, 90, 205, 0.1)' }}>
                  <img src="/creative-thinking.png" alt="Skills" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                </div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Skills</h3>
              </div>
              <p style={{ color: '#4b5563', lineHeight: 1.6, marginBottom: '24px', fontSize: '1.0625rem' }}>
                Plug-and-play tools for any agent, search, memory, code, vectors.
                <br />
                Reuse them. Pay per use or once. Build faster.
              </p>
              <Link href="/marketplace?itemType=SKILL" style={{ color: '#6a5acd', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontSize: '1.0625rem' }}>
                Browse Skills <ArrowRight size={18} />
              </Link>
            </div>

            {/* Agents Card */}
            <div style={{ flex: '1', minWidth: '300px', background: 'rgba(255,255,255,0.7)', borderRadius: '16px', padding: '32px', border: '1px solid rgba(255,255,255,0.8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <img src="/agents.png" alt="Agents" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                </div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Agents</h3>
              </div>
              <p style={{ color: '#4b5563', lineHeight: 1.6, marginBottom: '24px', fontSize: '1.0625rem' }}>
                Full workflows built from skills. Scanned, reviewed, and approved. Ready to run locally with license enforcement.
              </p>
              <Link href="/marketplace?itemType=AGENT" style={{ color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontSize: '1.0625rem' }}>
                Browse Agents <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section
        style={{
          padding: '64px 24px 100px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            padding: '56px 40px',
            background: 'rgba(255,255,255,0.5)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: '28px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.04)',
          }}
        >
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: '#111827',
              letterSpacing: '-0.025em',
              marginBottom: '12px',
            }}
          >
            Ready to get started<span style={{ color: '#4f46e5' }}>?</span>
          </h2>
          <p
            style={{
              fontSize: '1rem',
              color: '#6b7280',
              marginBottom: '32px',
              lineHeight: 1.6,
            }}
          >
            Join creators and teams building with verified AI agents today.
          </p>
          <Link href="/marketplace" className="btn-primary">
            Browse the Marketplace
            <span className="btn-icon">
              <ArrowRight size={14} />
            </span>
          </Link>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
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
  );
}
