import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { saveDataSource } from '../../utils/api';

const slideVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '0.4rem',
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
};

const generateFundEmail = () => 'safedeck16@gmail.com';

const DATA_SOURCE_OPTIONS = [
  {
    id: 'manual_upload',
    icon: '📤',
    title: 'Manual Upload',
    desc: 'Drag & drop a deck — see results instantly. Best for trials.',
    badge: 'Best for trial',
    badgeColor: 'var(--accent-purple)',
  },
  {
    id: 'email_filter',
    icon: '📧',
    title: 'Email Filter (Gmail)',
    desc: 'Forward decks automatically from your inbox. Best for production.',
    badge: 'Scale up',
    badgeColor: 'var(--accent-cyan)',
  },
  {
    id: 'webhook',
    icon: '🔌',
    title: 'Webhook / CRM',
    desc: 'Connect via API or CRM integration. Coming soon.',
    badge: 'Coming soon',
    badgeColor: 'rgba(255,255,255,0.2)',
    disabled: true,
  },
];

const Step5DataSource = ({ onNext, data, setData, user }) => {
  const safedeckEmail = data.safedeckEmail || generateFundEmail(data.fundName);
  const [selectedSource, setSelectedSource] = useState(data.dataSource || 'email_filter');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const autoSave = async () => {
      setSaving(true);
      try {
        await saveDataSource({
          userId: user?.userId,
          email: user?.email,
          dataSource: selectedSource,
          safedeckEmail: safedeckEmail,
        });
        setData(prev => ({ ...prev, dataSource: selectedSource, safedeckEmail }));
      } catch (err) {
        console.error('Failed to save data source:', err);
      } finally {
        setSaving(false);
      }
    };
    autoSave();
  }, [selectedSource]);

  const copyEmail = () => {
    navigator.clipboard.writeText(safedeckEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const instructionStep = (num, text) => (
    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.65rem' }}>
      <div style={{ minWidth: '22px', height: '22px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-purple)', flexShrink: 0 }}>{num}</div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{text}</p>
    </div>
  );

  return (
    <motion.div variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.4rem' }}>📥</span>
          <h2 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', margin: 0 }}>How will founders send you decks?</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Choose how pitch decks reach SafeDeck. You can change this later from Settings.
        </p>
      </div>

      {/* Source Selection Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
        {DATA_SOURCE_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => !opt.disabled && setSelectedSource(opt.id)}
            disabled={opt.disabled}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem',
              padding: '1rem 1.1rem',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: selectedSource === opt.id
                ? (opt.id === 'manual_upload' ? 'var(--accent-purple)' : 'var(--accent-cyan)')
                : 'rgba(255,255,255,0.08)',
              background: selectedSource === opt.id
                ? opt.id === 'manual_upload'
                  ? 'rgba(139, 92, 246, 0.08)'
                  : 'rgba(6, 182, 212, 0.06)'
                : 'rgba(255,255,255,0.02)',
              color: 'white',
              cursor: opt.disabled ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              fontFamily: 'Inter, sans-serif',
              opacity: opt.disabled ? 0.45 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '1.3rem', marginTop: '0.1rem', flexShrink: 0 }}>{opt.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{opt.title}</span>
                <span style={{ padding: '0.15rem 0.5rem', borderRadius: '20px', background: `${opt.badgeColor}22`, border: `1px solid ${opt.badgeColor}44`, color: opt.badgeColor, fontSize: '0.68rem', fontWeight: 600 }}>
                  {opt.badge}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>{opt.desc}</p>
            </div>
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%',
              border: `2px solid ${selectedSource === opt.id ? (opt.id === 'manual_upload' ? 'var(--accent-purple)' : 'var(--accent-cyan)') : 'rgba(255,255,255,0.15)'}`,
              background: selectedSource === opt.id ? (opt.id === 'manual_upload' ? 'var(--accent-purple)' : 'var(--accent-cyan)') : 'transparent',
              flexShrink: 0,
              marginTop: '0.15rem',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {selectedSource === opt.id && <span style={{ color: '#000', fontSize: '0.65rem', fontWeight: 900 }}>✓</span>}
            </div>
          </button>
        ))}
      </div>

      {/* Email Filter Config */}
      {selectedSource === 'email_filter' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* SafeDeck Email */}
          <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '12px', padding: '1rem 1.2rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your SafeDeck inbox
                {saving && <span style={{ color: 'var(--accent-cyan)', marginLeft: '0.5rem' }}>Saving...</span>}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <code style={{ fontSize: 'clamp(0.85rem, 2vw, 1.05rem)', color: 'var(--accent-cyan)', fontWeight: 700, flex: 1, wordBreak: 'break-all' }}>
                {safedeckEmail}
              </code>
              <button onClick={copyEmail} style={{ background: 'none', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '6px', padding: '0.35rem 0.7rem', cursor: 'pointer', color: copied ? '#10b981' : 'var(--accent-cyan)', fontSize: '0.78rem', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                {copied ? '✅ Copied' : '📋 Copy'}
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.4rem', marginBottom: 0 }}>
              Forward any email with a PDF attachment to this address.
            </p>
          </div>

          {/* Gmail filter steps */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'white', marginBottom: '0.85rem' }}>Set up Gmail filter:</div>
            {instructionStep(1, 'In Gmail → Settings ⚙️ → See All Settings → Filters → "Create a new filter"')}
            {instructionStep(2, 'Filter: Subject contains "pitch deck" or "deck", or has attachment (PDF)')}
            {instructionStep(3, `Check ✅ "Forward to" → Enter: ${safedeckEmail} → Save filter`)}
          </div>


        </motion.div>
      )}

      {/* Manual Upload Info */}
      {selectedSource === 'manual_upload' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ padding: '1.25rem', background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '12px', marginBottom: '1.25rem' }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--accent-purple)' }}>📤 Upload decks from your dashboard</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', margin: 0, lineHeight: 1.6 }}>
            After onboarding, head to your dashboard and upload pitch decks directly. We'll run them through the full pipeline — extraction, scoring, and sheet population.
          </p>
          <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {['Parse deck', 'Extract fields', 'Apply scoring', 'Fill your sheet'].map(step => (
              <span key={step} style={{ padding: '0.2rem 0.55rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '5px', color: 'var(--accent-purple)', fontSize: '0.72rem' }}>{step}</span>
            ))}
          </div>
        </motion.div>
      )}

      <button
        onClick={onNext}
        style={{
          marginTop: '0.5rem',
          padding: '0.9rem 2rem',
          background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: 'pointer',
          float: 'right',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        Continue →
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
};

export default Step5DataSource;
