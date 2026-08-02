import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { loginWithGoogle } from '../../utils/api';

const slideVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const Step1Auth = ({ onNext, onUserAuth }) => {
  const [status, setStatus] = useState(null); // null | 'loading' | 'error' | 'returning'
  const [errorMsg, setErrorMsg] = useState('');
  const [returningUser, setReturningUser] = useState(null);
  const navigate = useNavigate();

  const login = useGoogleLogin({
    scope: 'openid profile email https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
    access_type: 'offline',
    prompt: 'consent',
    onSuccess: async (tokenResponse) => {
      setStatus('loading');
      try {
        const userData = await loginWithGoogle(tokenResponse);
        onUserAuth(userData); // Always lift up full user object

        if (!userData.isNewUser) {
          // ── RETURNING USER ──
          const u = userData.user || {};
          const hasFullProfile = u.fund_name && u.role;

          setReturningUser(userData);
          setStatus('returning');

          // Brief delay to show the welcome-back toast, then route
          setTimeout(() => {
            if (hasFullProfile) {
              // Fully set-up user → straight to dashboard
              navigate('/dashboard');
            } else {
              // Partial profile → skip to relevant incomplete step
              onNext(); // Goes to Step 2 (pre-filled with existing data)
            }
          }, 2200);
        } else {
          // ── NEW USER ── proceed to Step 2 normally
          onNext();
        }
      } catch (err) {
        console.error('Auth failed:', err);
        setErrorMsg('Sign-in failed. Please try again.');
        setStatus('error');
      }
    },
    onError: (error) => {
      console.error('Google OAuth error:', error);
      setErrorMsg('Google sign-in was cancelled or failed.');
      setStatus('error');
    },
  });

  return (
    <motion.div variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }}>

      {/* Welcome-back toast overlay */}
      <AnimatePresence>
        {status === 'returning' && returningUser && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: '-1.5rem',
              left: 0,
              right: 0,
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '12px',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              zIndex: 10,
            }}
          >
            {returningUser.picture && (
              <img src={returningUser.picture} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#10b981' }}>
                Welcome back, {returningUser.givenName || returningUser.name}! 👋
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {(returningUser.user?.fund_name && returningUser.user?.role)
                  ? 'You\'re all set! Loading your dashboard...'
                  : 'Loading your profile...'}
              </div>
            </div>
            <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ textAlign: 'center', marginBottom: '2.5rem', marginTop: status === 'returning' ? '3.5rem' : 0, transition: 'margin 0.3s ease' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👋</div>
        <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: '0.5rem' }}>Welcome to SafeDeck!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '400px', margin: '0 auto' }}>
          Let's get you set up in 5 minutes.<br />No credit card required. Cancel anytime.
        </p>
      </div>

      <button
        onClick={() => { setStatus(null); setErrorMsg(''); login(); }}
        disabled={status === 'loading' || status === 'returning'}
        style={{
          width: '100%',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          background: (status === 'loading' || status === 'returning') ? '#e8eaed' : 'white',
          color: '#1a1a1a',
          border: 'none',
          borderRadius: '12px',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: (status === 'loading' || status === 'returning') ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          fontFamily: 'Inter, sans-serif',
          opacity: (status === 'loading' || status === 'returning') ? 0.75 : 1,
        }}
        onMouseEnter={e => { if (!['loading', 'returning'].includes(status)) e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        {(status === 'loading' || status === 'returning') ? (
          <>
            <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '2px solid #ccc', borderTopColor: '#4285F4', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            {status === 'returning' ? 'Redirecting...' : 'Signing you in...'}
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </>
        )}
      </button>

      {status === 'error' && (
        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.88rem', textAlign: 'center' }}>
          ❌ {errorMsg}
        </div>
      )}

      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '1.5rem' }}>
        By continuing, you agree to our{' '}
        <a href="#" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>Terms</a>
        {' '}&amp;{' '}
        <a href="#" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>Privacy Policy</a>
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
};

export default Step1Auth;
