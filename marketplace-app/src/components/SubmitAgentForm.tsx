'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload, FileArchive, Check, ArrowRight, ArrowLeft,
  X, Zap, Database, MessageSquare, BarChart2, Code2,
  FlaskConical, MoreHorizontal, Globe, HardDrive, Terminal,
  DollarSign, Tag, Sparkles,
} from 'lucide-react';

type ItemType = 'AGENT' | 'SKILL';
type Category = 'AUTOMATION' | 'DATA' | 'COMMUNICATION' | 'PRODUCTIVITY' | 'DEVTOOLS' | 'RESEARCH' | 'OTHER';

interface FormData {
  itemType: ItemType;
  displayName: string;
  description: string;
  category: Category;
  tags: string[];
  price: number;
  permNetwork: boolean;
  permFilesystem: boolean;
  permSubprocess: boolean;
}

const CATEGORIES: { key: Category; label: string; Icon: typeof Zap }[] = [
  { key: 'AUTOMATION', label: 'Automation', Icon: Zap },
  { key: 'DATA', label: 'Data', Icon: Database },
  { key: 'COMMUNICATION', label: 'Communication', Icon: MessageSquare },
  { key: 'PRODUCTIVITY', label: 'Productivity', Icon: BarChart2 },
  { key: 'DEVTOOLS', label: 'DevTools', Icon: Code2 },
  { key: 'RESEARCH', label: 'Research', Icon: FlaskConical },
  { key: 'OTHER', label: 'Other', Icon: MoreHorizontal },
];

const STEPS = ['Basic Info', 'Pricing & Permissions', 'Upload & Review'];

export function SubmitAgentForm({ onSuccess }: { onSuccess?: () => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    itemType: 'AGENT',
    displayName: '',
    description: '',
    category: 'DEVTOOLS',
    tags: [],
    price: 0,
    permNetwork: false,
    permFilesystem: false,
    permSubprocess: false,
  });
  const [tagInput, setTagInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<FormData>) => setForm(prev => ({ ...prev, ...patch }));

  /* ── Tag management ── */
  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t) && form.tags.length < 8) {
      update({ tags: [...form.tags, t] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    update({ tags: form.tags.filter(t => t !== tag) });
  };

  /* ── Drag & Drop ── */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.zip')) setFile(f);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  /* ── Validation ── */
  const canNext = () => {
    if (step === 0) return form.displayName.trim().length >= 2 && form.description.trim().length >= 10;
    if (step === 1) return true;
    if (step === 2) return file !== null;
    return false;
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!file) return;
    setSubmitting(true);
    setError(null);

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('metadata', JSON.stringify({
      itemType: form.itemType,
      displayName: form.displayName,
      description: form.description,
      category: form.category,
      tags: form.tags,
      price: form.price,
    }));

    try {
      const res = await fetch('/api/agents/upload', {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setSuccess(true);
      setTimeout(() => onSuccess?.(), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Shared glass style ── */
  const glass = {
    background: 'var(--card-bg)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--card-border)',
    borderRadius: '20px',
  } as const;

  const labelStyle = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 600 as const,
    color: 'var(--text-primary)',
    marginBottom: '6px',
  };

  const subLabel = {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  };

  /* ── Success state ── */
  if (success) {
    return (
      <div style={{ ...glass, padding: '64px 40px', textAlign: 'center', maxWidth: '540px', margin: '40px auto' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'rgba(16,185,129,0.12)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <Check size={28} style={{ color: '#10b981' }} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Submitted Successfully!
        </h2>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Your {form.itemType === 'SKILL' ? 'skill' : 'agent'} has been uploaded and is now pending review. You&apos;ll be redirected shortly.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 28px 48px' }}>

      {/* ── Step indicator ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '36px', padding: '0 20px' }}>
        {STEPS.map((label, i) => (
          <div key={label} style={{ display: 'contents' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div className={`creator-step-dot ${i < step ? 'completed' : i === step ? 'active' : ''}`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span style={{
                fontSize: '0.6875rem', fontWeight: 600,
                color: i <= step ? 'var(--text-primary)' : 'var(--text-muted)',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`creator-step-connector ${i < step ? 'completed' : ''}`} style={{ marginBottom: '20px' }} />
            )}
          </div>
        ))}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: '12px', marginBottom: '20px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#ef4444', fontSize: '0.875rem', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <X size={14} /> {error}
        </div>
      )}

      {/* ══════ STEP 1: Basic Info ══════ */}
      {step === 0 && (
        <div className="step-content" style={{ ...glass, padding: '32px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>
            Basic Information
          </h3>

          {/* Type toggle */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Type</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['AGENT', 'SKILL'] as const).map(t => (
                <button key={t} type="button" onClick={() => update({ itemType: t })} style={{
                  flex: 1, padding: '12px', borderRadius: '12px', cursor: 'pointer',
                  border: form.itemType === t ? '2px solid var(--accent)' : '1px solid rgba(0,0,0,0.08)',
                  background: form.itemType === t ? 'rgba(106,90,205,0.08)' : 'transparent',
                  color: form.itemType === t ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                  {t === 'AGENT' ? <Sparkles size={14} /> : <Code2 size={14} />}
                  {t === 'AGENT' ? 'AI Agent' : 'Skill'}
                </button>
              ))}
            </div>
          </div>

          {/* Display name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Display Name</label>
            <input
              className="creator-input"
              placeholder="e.g. Code Review Buddy"
              value={form.displayName}
              onChange={e => update({ displayName: e.target.value })}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              className="creator-input creator-textarea"
              placeholder="Describe what your agent does, its key features, and use cases..."
              value={form.description}
              onChange={e => update({ description: e.target.value })}
            />
          </div>

          {/* Category */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
              {CATEGORIES.map(({ key, label, Icon }) => (
                <button key={key} type="button" onClick={() => update({ category: key })} style={{
                  padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                  border: form.category === key ? '2px solid var(--accent)' : '1px solid rgba(0,0,0,0.06)',
                  background: form.category === key ? 'rgba(106,90,205,0.08)' : 'transparent',
                  color: form.category === key ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: 500, fontSize: '0.8125rem', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>Tags <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                className="creator-input"
                placeholder="Add a tag and press Enter"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                style={{ flex: 1 }}
              />
              <button type="button" onClick={addTag} style={{
                padding: '8px 16px', borderRadius: '10px', border: 'none',
                background: 'var(--accent)', color: '#fff', fontWeight: 600,
                fontSize: '0.8125rem', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                <Tag size={13} />
              </button>
            </div>
            {form.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {form.tags.map(tag => (
                  <span key={tag} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500,
                    background: 'rgba(106,90,205,0.1)', color: 'var(--accent)',
                  }}>
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 0, display: 'flex', color: 'var(--accent)',
                    }}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════ STEP 2: Pricing & Permissions ══════ */}
      {step === 1 && (
        <div className="step-content" style={{ ...glass, padding: '32px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>
            Pricing &amp; Permissions
          </h3>

          {/* Price */}
          <div style={{ marginBottom: '28px' }}>
            <label style={labelStyle}>
              <DollarSign size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Price (USD)
            </label>
            <p style={subLabel}>Set to 0 for free. Buyers pay with USDC on Arc Testnet.</p>
            <div style={{ position: 'relative', maxWidth: '200px', marginTop: '8px' }}>
              <span style={{
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem',
              }}>$</span>
              <input
                type="number" min="0" step="0.01"
                className="creator-input"
                style={{ paddingLeft: '28px' }}
                value={form.price}
                onChange={e => update({ price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label style={{ ...labelStyle, marginBottom: '12px' }}>Permissions Required</label>
            <p style={{ ...subLabel, marginBottom: '16px', marginTop: 0 }}>
              Declare what your agent needs access to. Buyers see this before purchasing.
            </p>

            {([
              { key: 'permNetwork' as const, label: 'Network Access', desc: 'Make HTTP requests, connect to APIs', Icon: Globe, color: '#3b82f6' },
              { key: 'permFilesystem' as const, label: 'Filesystem Access', desc: 'Read/write local files', Icon: HardDrive, color: '#f59e0b' },
              { key: 'permSubprocess' as const, label: 'Subprocess Execution', desc: 'Run shell commands or child processes', Icon: Terminal, color: '#ef4444' },
            ]).map(({ key, label, desc, Icon, color }) => (
              <button
                key={key} type="button"
                onClick={() => update({ [key]: !form[key] })}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  width: '100%', padding: '14px 16px', borderRadius: '14px',
                  marginBottom: '10px', cursor: 'pointer', textAlign: 'left',
                  border: form[key] ? `2px solid ${color}` : '1px solid rgba(0,0,0,0.06)',
                  background: form[key] ? `${color}08` : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: `${color}15`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</div>
                </div>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '6px',
                  border: form[key] ? `2px solid ${color}` : '2px solid rgba(0,0,0,0.15)',
                  background: form[key] ? color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                }}>
                  {form[key] && <Check size={13} style={{ color: '#fff' }} />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══════ STEP 3: Upload & Review ══════ */}
      {step === 2 && (
        <div className="step-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Upload zone */}
          <div
            className={`drop-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            {file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <FileArchive size={36} style={{ color: '#10b981' }} />
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  style={{
                    padding: '4px 12px', borderRadius: '8px', border: 'none',
                    background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <Upload size={36} style={{ color: 'var(--accent)', opacity: 0.6 }} />
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Drop your .zip package here
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    or click to browse — must contain agent.json or skill.json + README.md
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Review summary */}
          <div style={{ ...glass, padding: '24px', boxShadow: '0 4px 24px rgba(106,90,205,0.06)' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Submission Summary
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
              {([
                ['Type', form.itemType === 'SKILL' ? 'Skill' : 'Agent'],
                ['Name', form.displayName || '—'],
                ['Category', CATEGORIES.find(c => c.key === form.category)?.label || form.category],
                ['Price', form.price === 0 ? 'Free' : `$${form.price}`],
                ['Tags', form.tags.length > 0 ? form.tags.join(', ') : '—'],
                ['Permissions', [
                  form.permNetwork && 'Network',
                  form.permFilesystem && 'Filesystem',
                  form.permSubprocess && 'Subprocess',
                ].filter(Boolean).join(', ') || 'None'],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation buttons ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: '28px', gap: '12px',
      }}>
        {step > 0 ? (
          <button type="button" onClick={() => setStep(step - 1)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 20px', borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.08)', background: 'transparent',
            color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem',
            cursor: 'pointer', transition: 'all 0.2s',
          }}>
            <ArrowLeft size={14} /> Back
          </button>
        ) : <div />}

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => canNext() && setStep(step + 1)}
            disabled={!canNext()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 24px', borderRadius: '12px', border: 'none',
              background: canNext() ? 'var(--accent)' : 'rgba(0,0,0,0.08)',
              color: canNext() ? '#fff' : 'var(--text-muted)',
              fontWeight: 600, fontSize: '0.875rem',
              cursor: canNext() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: canNext() ? '0 4px 16px rgba(106,90,205,0.3)' : 'none',
            }}
          >
            Next <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canNext() || submitting}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 28px', borderRadius: '12px', border: 'none',
              background: canNext() && !submitting
                ? 'linear-gradient(135deg, #6a5acd, #8b5cf6)'
                : 'rgba(0,0,0,0.08)',
              color: canNext() && !submitting ? '#fff' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '0.9375rem',
              cursor: canNext() && !submitting ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: canNext() && !submitting ? '0 4px 20px rgba(106,90,205,0.35)' : 'none',
            }}
          >
            {submitting ? (
              <>
                <div style={{
                  width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }} />
                Uploading…
              </>
            ) : (
              <>
                <Upload size={16} /> Submit for Review
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
