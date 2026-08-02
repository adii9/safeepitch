import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const slideVariants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0 },
};

const summaryItems = [
  { icon: '🔐', label: 'Account', done: true },
  { icon: '🎯', label: 'Evaluation Criteria', done: true },
  { icon: '🗺️', label: 'Sheet Mapping', done: true },
  { icon: '📥', label: 'Data Source', done: true },
];

const Step6Done = ({ data, isPaid }) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Auto-redirect to dashboard after 3s when paid=true
  useEffect(() => {
    if (!isPaid) return;
    const tick = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(tick);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [isPaid, navigate]);

  return (
    <motion.div variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}
        >
          ✅
        </motion.div>
        <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: '0.4rem' }}>You're all set!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Your 30-day free trial has started. Your SafeDeck workspace is ready.
        </p>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 180 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '100px',
            padding: '0.45rem 1.1rem',
            marginTop: '0.85rem',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: '#10b981',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)',
          }}
        >
          🎁 30-day free trial started ✅
        </motion.div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
        {summaryItems.map(item => (
          <div key={item.label} style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>✓ Connected</div>
            </div>
          </div>
        ))}
      </div>

      {/* Processing Animation */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.4rem', marginBottom: '2rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
          {progress < 100 ? '🕐 Setting up your workspace...' : '🎉 Your workspace is ready!'}
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.75rem' }}>
          <motion.div
            style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))', borderRadius: '3px' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
          {progress < 100
            ? 'Activating your evaluation criteria, sheet mapping, and inbox routing...'
            : 'Everything is configured. Upload your first deck to see it in action.'}
        </p>
      </div>

      {/* Auto-redirect notice when paid */}
      {isPaid && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            textAlign: 'center',
            marginBottom: '1.25rem',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
          }}
        >
          Redirecting to dashboard in <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{countdown}s</span>…
        </motion.div>
      )}

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ padding: '0.9rem 2.5rem', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 20px rgba(6, 182, 212, 0.3)' }}
        >
          Go to Dashboard →
        </button>
        <button
          onClick={() => navigate('/')}
          style={{ padding: '0.9rem 2rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '1rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
        >
          Back to Home
        </button>
      </div>
    </motion.div>
  );
};

export default Step6Done;

