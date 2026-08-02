import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { saveDriveFolderId } from '../../utils/api';

const slideVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const SERVICE_EMAIL = 'safedeck-drive@navmool.iam.gserviceaccount.com';

// Extract folder ID from a full Drive URL or raw ID
const parseFolderId = (input) => {
  const match = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : input.trim();
};

const Step4Drive = ({ onNext, data, setData, user, alreadyConnected }) => {
  const [folderInput, setFolderInput] = useState(data.driveFolderId || '');
  const [status, setStatus] = useState(alreadyConnected ? 'success' : null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText(SERVICE_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    if (!folderInput.trim()) return;
    const folderId = parseFolderId(folderInput);
    setStatus('loading');
    setErrorMsg('');
    try {
      await saveDriveFolderId({
        userId: user?.userId,
        email: user?.email,
        driveFolderId: folderId,
      });
      setData(prev => ({ ...prev, driveFolderId: folderId }));
      setStatus('success');
    } catch (err) {
      console.error('Failed to save Drive folder:', err);
      setStatus('error');
      setErrorMsg('We couldn\'t verify access to this folder. Make sure you\'ve shared it with the service account email above and given Editor permissions.');
    }
  };

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.file',
    onSuccess: async (tokenResponse) => {
      try {
        setStatus('loading');
        const accessToken = tokenResponse.access_token;
        
        // 1. Create a folder in their Drive
        const res = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'SafeDeck Pitch Decks',
            mimeType: 'application/vnd.google-apps.folder'
          })
        });
        
        if (!res.ok) throw new Error('Failed to create folder');
        const folderData = await res.json();
        const autoFolderId = folderData.id;

        // 2. Save token and folder to local storage
        const stored = JSON.parse(localStorage.getItem('safedeck_user') || '{}');
        stored.access_token = accessToken;
        stored.driveFolderId = autoFolderId;
        localStorage.setItem('safedeck_user', JSON.stringify(stored));

        // 3. Save to backend
        await saveDriveFolderId({ userId: user?.userId, email: user?.email, driveFolderId: autoFolderId });
        setData(prev => ({ ...prev, driveFolderId: autoFolderId, access_token: accessToken }));
        setStatus('success');
      } catch (err) {
        console.error(err);
        setStatus('error');
        setErrorMsg('Failed to setup Google Drive. Please try again.');
      }
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      setStatus('error');
      setErrorMsg('Google login failed.');
    }
  });

  const handleAutoConnect = () => {
    login();
  };

  const instructionStep = (num, text, extra) => (
    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
      <div style={{ minWidth: '22px', height: '22px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-cyan)', flexShrink: 0 }}>{num}</div>
      <div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{text}</p>
        {extra}
      </div>
    </div>
  );

  return (
    <motion.div variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>📁</span>
        <h2 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', margin: 0 }}>Where should we store your pitch decks?</h2>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
        We'll store PDFs in your own Google Drive. Only you and SafeDeck can access it.
      </p>

      {/* OAuth auto-setup */}
      <button
        onClick={handleAutoConnect}
        disabled={status === 'loading'}
        style={{ width: '100%', padding: '0.9rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: 'white', color: '#1a1a1a', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', marginBottom: '1.25rem', fontFamily: 'Inter, sans-serif', opacity: status === 'loading' ? 0.7 : 1 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Connect Google Drive (Auto-setup)
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>OR set up manually (2 mins)</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
        {instructionStep(1, 'Open Google Drive → New → Folder → name it "SafeDeck Pitch Decks"')}
        {instructionStep(2, 'Right-click folder → Share → paste this email:', (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.15)', borderRadius: '6px', padding: '0.5rem 0.75rem', marginTop: '0.4rem' }}>
            <code style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', flex: 1, wordBreak: 'break-all' }}>{SERVICE_EMAIL}</code>
            <button onClick={copyEmail} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#10b981' : 'var(--text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>
              {copied ? '✅' : '📋 Copy'}
            </button>
          </div>
        ))}
        {instructionStep(3, 'Set permission to "Editor" → Send. Then paste the folder\'s URL or ID below.')}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <input
          value={folderInput}
          onChange={e => { setFolderInput(e.target.value); setStatus(null); setErrorMsg(''); }}
          placeholder="https://drive.google.com/drive/folders/..."
          style={{ flex: 1, padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', outline: 'none' }}
        />
        <button
          onClick={handleVerify}
          disabled={!folderInput.trim() || status === 'loading'}
          style={{ padding: '0.75rem 1rem', background: 'var(--accent-purple)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: !folderInput.trim() || status === 'loading' ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', opacity: !folderInput.trim() || status === 'loading' ? 0.6 : 1 }}
        >
          {status === 'loading' ? '...' : 'Verify →'}
        </button>
      </div>

      {status === 'success' && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10b981', fontSize: '0.85rem', marginBottom: '1rem' }}>
          ✅ Folder connected &amp; saved — SafeDeck Pitch Decks
        </div>
      )}
      {status === 'error' && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
          ❌ {errorMsg}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={status !== 'success'}
        style={{ marginTop: '0.75rem', padding: '0.9rem 2rem', background: status === 'success' ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))' : 'rgba(255,255,255,0.08)', color: status === 'success' ? 'white' : 'var(--text-secondary)', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 600, cursor: status === 'success' ? 'pointer' : 'not-allowed', float: 'right', fontFamily: 'Inter, sans-serif' }}
      >
        Continue →
      </button>
    </motion.div>
  );
};

export default Step4Drive;
