import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, CreditCard, Lock, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { loginWithGoogle, createOrder, verifyPayment } from '../utils/api';

const PLANS = {
  starter: {
    name: 'Starter',
    price: 30000,
    priceLabel: '₹30,000',
    period: 'per month',
    description: 'Perfect for early-stage funds getting started with AI-powered deal flow.',
    color: 'rgba(59, 130, 246, 0.8)',
    glow: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.25)',
    perks: ['40 pitch deck audits/mo', 'Overage: ₹600 / $7.50 per deck', 'AI Audit (Team, Market, Financials)', 'Google Sheets CRM sync', '1 email inbox'],
  },
  growth: {
    name: 'Growth',
    price: 55000,
    priceLabel: '₹55,000',
    period: 'per month',
    description: 'For active funds processing serious deal flow with full CRM integration.',
    color: 'rgba(139, 92, 246, 0.8)',
    glow: 'rgba(139, 92, 246, 0.18)',
    border: 'rgba(139, 92, 246, 0.4)',
    perks: ['120 pitch deck audits/mo', 'Overage: ₹400 / $5 per deck', 'Full AI Audit + Red Flags', 'Sheets + Affinity + HubSpot', '3 email inboxes', 'Comparison Views', 'API Access', 'Priority Support'],
    badge: 'Most Popular',
  },
  enterprise: {
    name: 'Enterprise',
    price: 100000,
    priceLabel: '₹1,00,000',
    period: 'per month',
    description: 'For funds that need unlimited scale and dedicated support.',
    color: 'rgba(6, 182, 212, 0.8)',
    glow: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.25)',
    perks: ['Unlimited pitch deck audits', 'Custom AI configuration', 'All CRM integrations', 'Unlimited email inboxes', 'Custom branded PDFs', 'API Access', 'Dedicated account manager', '99.9% SLA & Custom Onboarding'],
  },
};

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.querySelector('script[src*="razorpay"]')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planKey = (searchParams.get('plan') || 'starter').toLowerCase();
  const plan = PLANS[planKey] || PLANS.starter;

  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('safedeck_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authStatus, setAuthStatus] = useState(null);
  const [authError, setAuthError] = useState('');

  const login = useGoogleLogin({
    scope: 'openid profile email https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
    prompt: 'consent',
    onSuccess: async (tokenResponse) => {
      setAuthStatus('loading');
      setAuthError('');
      try {
        const userData = await loginWithGoogle(tokenResponse.access_token);
        setUser(userData);
        setAuthStatus(null);
      } catch (err) {
        console.error('Auth failed:', err);
        setAuthError('Sign-in failed. Please try again.');
        setAuthStatus('error');
      }
    },
    onError: (error) => {
      console.error('Google OAuth error:', error);
      setAuthError('Google sign-in was cancelled or failed.');
      setAuthStatus('error');
    },
  });

  useEffect(() => {
    loadRazorpayScript().then(setScriptReady);
  }, []);

  const handlePayment = async () => {
    if (!scriptReady) {
      alert('Payment gateway is loading, please try again in a moment.');
      return;
    }

    if (!user) {
      alert('Please sign in to continue.');
      return;
    }

    setLoading(true);
    setCancelled(false);

    try {
      const orderData = await createOrder({
        userId: user.userId,
        email: user.email,
        plan: planKey,
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SZo8FEBQU8fSsj',
        amount: plan.price * 100, // paise
        currency: 'INR',
        name: 'SafeDeck',
        description: `${plan.name} Plan — ${plan.period}`,
        image: '',
        order_id: orderData.order_id || orderData.id,
        theme: {
          color: '#8b5cf6',
          hide_topbar: false,
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
        },
        notes: {
          plan: planKey,
        },
        handler: async function (response) {
          try {
            await verifyPayment({
              userId: user.userId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            window.location.href = '/onboarding?paid=true';
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('Payment verified, but there was an error. Please contact support.');
            window.location.href = '/onboarding?paid=true';
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setCancelled(true);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function () {
        setLoading(false);
        setCancelled(true);
      });

      rzp.open();
    } catch (err) {
      console.error('Failed to create order:', err);
      alert('Failed to initialize payment. Error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Background glow effects */}
      <div style={{ position: 'absolute', top: '-150px', left: '-150px', width: '500px', height: '500px', background: `radial-gradient(circle, ${plan.glow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-200px', right: '-150px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: '1.5rem', left: '2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate('/pricing')}>
        <ChevronLeft size={16} color="var(--text-secondary)" />
        <span className="mobile-hidden" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Back to Pricing</span>
      </div>
      <div style={{ position: 'absolute', top: '1.5rem', left: '50%', transform: 'translateX(-50%)', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SafeDeck</span>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'rgba(15, 18, 24, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: 'clamp(1.75rem, 5vw, 2.75rem)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Plan Badge */}
        {plan.badge && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
            color: 'white',
            padding: '0.3rem 0.9rem',
            borderRadius: '100px',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '1rem',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
          }}>
            ⭐ {plan.badge}
          </div>
        )}

        {/* Order Summary Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: '0.5rem' }}>Order Summary</p>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
            {plan.name} <span className="text-gradient">Plan</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>{plan.description}</p>
        </div>

        {/* Price Block */}
        <div style={{
          background: `linear-gradient(135deg, ${plan.glow}, rgba(255,255,255,0.02))`,
          border: `1px solid ${plan.border}`,
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Your Trial</div>
            <div style={{ fontSize: '2.6rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>FREE</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>1 month · no charges today</div>
          </div>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `${plan.glow}`, border: `1px solid ${plan.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={24} color={plan.color} />
          </div>
        </div>

        {/* Perks List */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '0.9rem' }}>Included in {plan.name}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {plan.perks.map((perk) => (
              <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle2 size={15} color="var(--accent-green)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Button Area */}
        {!user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            <motion.button
              onClick={() => { setAuthStatus(null); setAuthError(''); login(); }}
              disabled={authStatus === 'loading'}
              whileHover={{ scale: authStatus === 'loading' ? 1 : 1.02, y: -2 }}
              whileTap={{ scale: authStatus === 'loading' ? 1 : 0.98 }}
              style={{
                width: '100%',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                background: authStatus === 'loading' ? '#e8eaed' : 'white',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: '14px',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: authStatus === 'loading' ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 4px 20px rgba(255,255,255,0.15)',
                transition: 'all 0.3s ease',
              }}
            >
              {authStatus === 'loading' ? (
                <>
                  <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '2px solid #ccc', borderTopColor: '#4285F4', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Signing you in...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google to continue
                </>
              )}
            </motion.button>
            {authError && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                {authError}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {user.picture && <img src={user.picture} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Signed in as <strong style={{ color: 'white' }}>{user.email}</strong></span>
            </div>
            <motion.button
              onClick={() => navigate('/onboarding?paid=true')}
              whileHover={{ scale: 1.02, boxShadow: '0 12px 32px rgba(139, 92, 246, 0.5)' }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontSize: '1.05rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.35)',
                transition: 'background 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
              }}
            >
              <Lock size={16} />
              Start 1-Month Free Trial
            </motion.button>
          </div>
        )}

        {/* Security Note */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
          <ShieldCheck size={13} color="var(--accent-green)" />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>1-month free trial · no payment required today</span>
        </div>

        {/* Cancelled Message */}
        <AnimatePresence>
          {cancelled && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                marginTop: '0.5rem',
              }}
            >
              <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
                Trial not started yet. Reach out to{' '}
                <a href="mailto:help@safedeck.ai" style={{ color: '#ef4444', fontWeight: 600 }}>
                  help@safedeck.ai
                </a>
                {' '}if you need assistance.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer note */}
      <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.78rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        After your trial, you'll be asked to choose a plan. ·{' '}
        Need help? <a href="mailto:help@safedeck.ai" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>help@safedeck.ai</a>
      </p>
    </div>
  );
};

export default Checkout;
