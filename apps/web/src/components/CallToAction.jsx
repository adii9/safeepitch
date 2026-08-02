import React from 'react';
import { motion } from 'framer-motion';

const CallToAction = () => {
  return (
    <section style={{ padding: '100px 0', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '800px',
        height: '400px',
        background: 'var(--accent-purple)',
        filter: 'blur(200px)',
        opacity: 0.15,
        borderRadius: '50%',
        zIndex: -1
      }} />
      <div className="container">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-panel mobile-p-4"
          style={{ padding: '4rem 2rem', textAlign: 'center', border: '1px solid var(--accent-purple)' }}
        >
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', marginBottom: '1.5rem', lineHeight: 1.2 }}>
            Your Deal Intelligence Is Only As Good As <span className="text-gradient">How Fast It Reaches Your Team.</span>
          </h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto 3rem auto', lineHeight: 1.6 }}>
            SafeDeck works where you work — in your inbox, your CRM, your Slack. Not in a separate browser tab you'll forget to open.
          </p>
          <div className="mobile-btn-stack" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-primary pulse-glowing" onClick={() => window.location.href = '/onboarding?paid=true'} style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
              Start Free Trial — No Payment Required
            </button>
            <button className="btn btn-secondary" onClick={() => window.location.href = '/sample-audit'} style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
              See It Working in Your CRM
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
