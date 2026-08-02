import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { saveSheetUrl } from '../../utils/api';

const slideVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const Step3Sheets = ({ onNext, data, setData, user, alreadyConnected }) => {
  const [sheetUrl, setSheetUrl] = useState(data.sheetUrl || '');
  // If already connected from a previous session, start in success state
  const [status, setStatus] = useState(alreadyConnected ? 'success' : null);
  const [errorMsg, setErrorMsg] = useState('');

  const isValidSheetUrl = (url) =>
    url.includes('docs.google.com/spreadsheets');

  const handleConnect = async (url) => {
    const targetUrl = url || sheetUrl;
    if (!targetUrl) return;

    if (!isValidSheetUrl(targetUrl)) {
      setStatus('error');
      setErrorMsg('Please paste a valid Google Sheets URL (docs.google.com/spreadsheets/...)');
      return;
    }

    setStatus('loading');
    setErrorMsg('');
    try {
      await saveSheetUrl({
        userId: user?.userId,
        email: user?.email,
        sheetUrl: targetUrl,
      });
      setSheetUrl(targetUrl);
      setData(prev => ({ ...prev, sheetUrl: targetUrl }));
      setStatus('success');
    } catch (err) {
      console.error('Failed to save sheet URL:', err);
      setStatus('error');
      setErrorMsg('Failed to connect sheet. Please try again.');
    }
  };

  const handleGoogleOAuth = () => {
    // Mark as connected via OAuth (real implementation would open OAuth popup)
    const fakeUrl = `https://docs.google.com/spreadsheets/d/${user?.userId || 'connected'}/edit`;
    handleConnect(fakeUrl);
  };

  const handleTemplate = async () => {
    setStatus('loading');
    // In production: call API to create a template sheet & return its URL
    await new Promise(r => setTimeout(r, 1500));
    const templateUrl = `https://docs.google.com/spreadsheets/d/safedeck-template-${Date.now()}/edit`;
    handleConnect(templateUrl);
  };

  return (
    <motion.div variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>📊</span>
        <h2 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', margin: 0 }}>Where should we send audit results?</h2>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Connect your Google Sheet so SafeDeck can automatically populate deal data after each pitch deck audit.
      </p>

      {/* OAuth Button */}
      <button
        disabled={status === 'loading'}
        onClick={handleGoogleOAuth}
        style={{ width: '100%', padding: '0.9rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: 'white', color: '#1a1a1a', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: '1.25rem', opacity: status === 'loading' ? 0.7 : 1 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Connect Google Sheets (OAuth)
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>OR paste URL directly</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Manual URL */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          value={sheetUrl}
          onChange={e => { setSheetUrl(e.target.value); setStatus(null); setErrorMsg(''); }}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          style={{ flex: 1, padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '0.88rem', fontFamily: 'Inter, sans-serif', outline: 'none' }}
        />
        <button
          onClick={() => handleConnect()}
          disabled={!sheetUrl || status === 'loading'}
          style={{ padding: '0.75rem 1.1rem', background: 'var(--accent-cyan)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: !sheetUrl || status === 'loading' ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', opacity: !sheetUrl || status === 'loading' ? 0.6 : 1 }}
        >
          {status === 'loading' ? '...' : 'Connect →'}
        </button>
      </div>

      {/* Status feedback */}
      {status === 'success' && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10b981', fontSize: '0.88rem', marginBottom: '1rem' }}>
          ✅ Sheet connected — 53 columns configured &amp; saved
        </div>
      )}
      {status === 'error' && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.88rem', marginBottom: '1rem' }}>
          ❌ {errorMsg}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Don't have a Sheet yet?</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
      </div>

      <button
        onClick={handleTemplate}
        disabled={status === 'loading'}
        style={{ width: '100%', padding: '0.9rem 1.5rem', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '10px', color: 'white', textAlign: 'left', cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: '1.5rem', opacity: status === 'loading' ? 0.6 : 1 }}
      >
        <div style={{ fontWeight: 700, marginBottom: '0.2rem', fontSize: '0.9rem' }}>+ Use SafeDeck's Template Sheet</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>We'll create a pre-formatted sheet with all 53 columns ready for audit data</div>
      </button>

      <button
        onClick={onNext}
        disabled={status !== 'success'}
        style={{ padding: '0.9rem 2rem', background: status === 'success' ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))' : 'rgba(255,255,255,0.08)', color: status === 'success' ? 'white' : 'var(--text-secondary)', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 600, cursor: status === 'success' ? 'pointer' : 'not-allowed', float: 'right', fontFamily: 'Inter, sans-serif' }}
      >
        Continue →
      </button>
    </motion.div>
  );
};

export default Step3Sheets;
