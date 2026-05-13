'use client';

import { useState } from 'react';
import { X, Sparkles, CheckCircle, Loader2 } from 'lucide-react';

const CATEGORIES = [
  { value: 'AUTOMATION', label: 'Automation' },
  { value: 'DATA', label: 'Data Processing' },
  { value: 'COMMUNICATION', label: 'Communication' },
  { value: 'PRODUCTIVITY', label: 'Productivity' },
  { value: 'DEVTOOLS', label: 'Developer Tools' },
  { value: 'RESEARCH', label: 'Research' },
  { value: 'OTHER', label: 'Other' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CustomRequestModal({ open, onClose }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    title: '',
    description: '',
    category: 'OTHER',
    budget: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/custom-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setError('');
      setForm({ name: '', email: '', title: '', description: '', category: 'OTHER', budget: '' });
    }, 300);
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '28px 32px 24px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(106, 90, 205, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={20} style={{ color: '#6a5acd' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                Request a Custom Workflow
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '2px 0 0' }}>
                Tell us what you need — our creators will build it.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#9ca3af',
              flexShrink: 0,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px 32px' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <CheckCircle size={32} style={{ color: '#10b981' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                Request received!
              </h3>
              <p style={{ color: '#6b7280', lineHeight: 1.6, marginBottom: '24px' }}>
                We've logged your request. Our creator community will review it and you'll hear back at <strong>{form.email}</strong>.
              </p>
              <button
                onClick={handleClose}
                style={{
                  background: '#6a5acd',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 24px',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <label style={labelStyle}>Your Name</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Jane Smith"
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="jane@company.com"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>What do you need built?</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  maxLength={120}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="e.g. Slack → Notion meeting summarizer"
                  style={inputStyle}
                />
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px', display: 'block' }}>
                  {form.title.length}/120
                </span>
              </div>

              <div>
                <label style={labelStyle}>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  style={{ ...inputStyle, background: 'white' }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Describe your workflow in detail</label>
                <textarea
                  required
                  rows={5}
                  value={form.description}
                  maxLength={2000}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Describe what the workflow should do, what tools/APIs it should connect to, what the inputs and outputs are, and any specific requirements..."
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px', display: 'block' }}>
                  {form.description.length}/2000
                </span>
              </div>

              <div>
                <label style={labelStyle}>Budget (optional)</label>
                <input
                  type="text"
                  value={form.budget}
                  onChange={(e) => set('budget', e.target.value)}
                  placeholder="e.g. $50–$200 one-time, or open to suggestions"
                  style={inputStyle}
                />
              </div>

              {error && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '0.875rem',
                    color: '#dc2626',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? '#a5b4fc' : '#6a5acd',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '13px 24px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.15s',
                }}
              >
                {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                {loading ? 'Submitting…' : 'Submit Request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid #e5e7eb',
  borderRadius: '10px',
  fontSize: '0.9375rem',
  color: '#111827',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};
