import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, LogOut, Menu, X } from 'lucide-react';
import { googleLogout } from '@react-oauth/google';
import { useGoogleLogin } from '@react-oauth/google';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const login = useGoogleLogin({
    scope: 'openid profile email https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
    prompt: 'consent',
    onSuccess: async (codeResponse) => {
      try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${codeResponse.access_token}` }
        });
        const userInfo = await userInfoResponse.json();

        const syncPayload = {
          httpMethod: 'POST',
          body: JSON.stringify({ userId: userInfo.sub || `google_${Date.now()}`, email: userInfo.email }),
          headers: { 'Content-Type': 'application/json' },
          requestContext: { identity: { sourceIp: '127.0.0.1' } },
        };

        const syncResponse = await fetch(
          'https://i7az96pt3l.execute-api.eu-north-1.amazonaws.com/default/user-sync',
          {
            method: 'POST',
            headers: {
              'x-api-key': import.meta.env.VITE_AWS_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(syncPayload),
          }
        );

        if (syncResponse.ok) {
          let syncData = JSON.parse(await syncResponse.text()).body;
          if (typeof syncData === 'string') syncData = JSON.parse(syncData);

          localStorage.setItem('safedeck_user', JSON.stringify({
            name: userInfo.name,
            email: userInfo.email,
            picture: userInfo.picture,
            givenName: userInfo.given_name,
            userId: userInfo.sub,
            access_token: codeResponse.access_token,
            user: syncData.user || {},
          }));

          setCurrentUser({ ...userInfo, user: syncData.user || {} });
          window.location.href = '/onboarding?paid=true';
        }
      } catch (error) {
        console.error('Login failed:', error);
      }
    },
    onError: (error) => console.log('Login Failed:', error),
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    // Check for logged-in user
    try {
      const stored = localStorage.getItem('safedeck_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {}

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    try {
      googleLogout();
    } catch (e) {}
    localStorage.removeItem('safedeck_user');
    window.location.href = '/';
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      width: '100%',
      zIndex: 100,
      transition: 'all 0.3s ease',
      padding: scrolled ? '1rem 0' : '1.5rem 0',
      background: scrolled ? 'rgba(8, 10, 14, 0.8)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border-color)' : '1px solid transparent'
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.5rem', color: 'white' }}
          >
            <div style={{ color: 'var(--accent-cyan)' }}>
              <Layers size={28} />
            </div>
            SafeDeck
          </motion.div>
        </a>
        
        <motion.nav 
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontWeight: '500' }}
        >
          <a href="/#workflow" className="mobile-hidden" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>How it Works</a>
          <a href="/#features" className="mobile-hidden" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>Features</a>
          <a href="/#integrations" className="mobile-hidden" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>Integrations</a>
          <a href="/pricing" className="mobile-hidden" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>Pricing</a>
          
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginLeft: '0.5rem' }}>
              <div style={{ textAlign: 'right' }} className="mobile-hidden">
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{currentUser?.user?.name || currentUser?.user?.email || 'User'}</div>
              </div>
              {currentUser?.user?.picture ? (
                <img src={currentUser.user.picture} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--accent-purple)' }} />
              ) : (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                  {(currentUser?.user?.name || currentUser?.user?.email || 'U')[0]?.toUpperCase()}
                </div>
              )}
              
              <button 
                className="btn btn-secondary mobile-hidden" 
                onClick={handleLogout}
                style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
              >
                <LogOut size={14} /> <span>Logout</span>
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => window.location.href = '/dashboard'}
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
              >
                Dashboard
              </button>
            </div>
          ) : (
            <>
              <button
                className="btn btn-secondary mobile-hidden"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.95rem' }}
                onClick={login}
              >
                Login
              </button>

            </>
          )}
          
          <button 
            className="mobile-block" 
            style={{ display: 'none', border: 'none', background: 'transparent', color: 'white', cursor: 'pointer', padding: '0.5rem' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </motion.nav>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}
          >
            <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
              <a href="/#workflow" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '1.1rem' }}>How it Works</a>
              <a href="/#features" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '1.1rem' }}>Features</a>
              <a href="/#integrations" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '1.1rem' }}>Integrations</a>
              <a href="/pricing" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '1.1rem' }}>Pricing</a>
              {currentUser ? (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <LogOut size={16} /> Logout
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => { login(); setMobileMenuOpen(false); }}
                  >
                    Login
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  );
};

export default Header;
