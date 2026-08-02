import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Mail } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { loginWithGoogle } from '../utils/api';
import ThreeDScene from './ThreeDScene';

const Hero = () => {
  const navigate = useNavigate();

  const login = useGoogleLogin({
    scope: 'openid profile email https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
    prompt: 'consent',
    onSuccess: async (codeResponse) => {
      try {
        // 1. Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${codeResponse.access_token}` },
        });
        const userInfo = await userInfoResponse.json();

        // 2. Sync to our backend via the new API client
        await loginWithGoogle({
          access_token: codeResponse.access_token,
          refresh_token: codeResponse.refresh_token,
          userInfo,
        });

        // Persist user data so Dashboard can personalise the experience
        localStorage.setItem('safedeck_user', JSON.stringify({
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture,
          givenName: userInfo.given_name,
          userId: userInfo.sub,
          access_token: codeResponse.access_token,
        }));

        navigate('/onboarding?paid=true');
      } catch (error) {
        console.error('Authentication process failed:', error);
      }
    },
    onError: (error) => console.log('Login Failed:', error),
  });
  return (
    <section className="section-padding" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center',
      paddingTop: '100px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glows */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '400px',
        height: '400px',
        background: 'var(--accent-purple)',
        filter: 'blur(150px)',
        opacity: 0.2,
        borderRadius: '50%',
        zIndex: -1
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '500px',
        height: '500px',
        background: 'var(--accent-cyan)',
        filter: 'blur(150px)',
        opacity: 0.15,
        borderRadius: '50%',
        zIndex: -1
      }} />

      <div className="container responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '4rem', alignItems: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div style={{ 
            display: 'inline-block',
            padding: '0.5rem 1rem',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '20px',
            color: 'var(--accent-blue)',
            fontWeight: 600,
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            width: 'fit-content'
           }}>
            Deal Intelligence · CRM Integration · Continuous Monitoring
          </div>
          <h1 style={{ lineHeight: '1.15' }}>
            <span className="text-gradient">Your Deal Intelligence Layer.</span> Always On.
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', maxWidth: '540px' }}>
            SafeDeck continuously reads every pitch deck, meeting note, and founder update — and feeds structured, verified deal intelligence directly into your CRM, your sheets, and your deal team. No manual entry. No context switching.
          </p>
          <div className="mobile-btn-stack" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
             <button className="btn btn-primary pulse-glowing" onClick={() => window.location.href = '#integrations'}>
                See How It Integrates <Zap size={18} />
             </button>
             <button className="btn btn-secondary" onClick={() => navigate('/sample-audit')}>
                View Sample Deal Profile
             </button>
          </div>
        </motion.div>

        {/* Immersive 3D Visual Element */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="hero-canvas-container"
          style={{ position: 'relative', height: '600px', overflow: 'visible', cursor: 'grab' }}
        >
           <ThreeDScene />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
