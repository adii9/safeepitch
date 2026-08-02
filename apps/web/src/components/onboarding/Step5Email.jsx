import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { saveEmailRouting } from '../../utils/api';

const slideVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

// Generate fund email slug from fund name
const generateFundEmail = () => 'safedeck16@gmail.com';

const Step5Email = ({ onNext, data, setData, user, alreadyConnected }) => {
  // Use saved email from server if available, otherwise derive from fund name
  const safedeckEmail = data.safedeckEmail || generateFundEmail(data.fundName);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(alreadyConnected || false);
  const [saving, setSaving] = useState(false);

  // Auto-save email routing when step renders
  useEffect(() => {
    const save = async () => {
      if (saved) return;
      setSaving(true);
      try {
        await saveEmailRouting({
          userId: user?.userId,
          email: user?.email,
          safedeckEmail,
        });
        setData(prev => ({ ...prev, safedeckEmail }));
        setSaved(true);
      } catch (err) {
        console.error('Failed to save email routing:', err);
      } finally {
        setSaving(false);
      }
    };
    save();
  }, []);

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
      {/* Returning user banner */}
      {alreadyConnected && (
        <div style={{ padding: '0.65rem 1rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', color: '#10b981', fontSize: '0.83rem', fontWeight: 600, marginBottom: '1rem' }}>
          ✅ Email routing previously configured — your inbox is still active.
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>📧</span>
        <h2 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', margin: 0 }}>How should founders send you pitch decks?</h2>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
        Set up a Gmail filter (takes 3 minutes). Any pitch deck emailed to you gets forwarded to SafeDeck for automatic processing.
      </p>

      {/* SafeDeck Email Address */}
      <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '12px', padding: '1rem 1.2rem', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Your SafeDeck inbox
          {saving && <span style={{ color: 'var(--accent-cyan)', marginLeft: '0.5rem' }}>Saving...</span>}
          {saved && <span style={{ color: '#10b981', marginLeft: '0.5rem' }}>✓ Configured</span>}
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
          Founders email decks here → SafeDeck processes them automatically.
        </p>
      </div>

      {/* Gmail Filter Steps */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'white', marginBottom: '0.85rem' }}>Set up Gmail filter:</div>
        {instructionStep(1, 'In Gmail → Settings ⚙️ → See All Settings → Filters → "Create a new filter"')}
        {instructionStep(2, 'Filter criteria: Subject contains "pitch deck" or "deck", or has: attachment (PDF)')}
        {instructionStep(3, `Check ✅ "Forward to" → Enter: ${safedeckEmail} → Save filter`)}
      </div>

      <button
        onClick={onNext}
        style={{ padding: '0.9rem 2rem', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', float: 'right', fontFamily: 'Inter, sans-serif' }}
      >
        Continue →
      </button>
    </motion.div>
  );
};

export default Step5Email;
