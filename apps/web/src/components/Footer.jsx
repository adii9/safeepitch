import React from 'react';
import { Layers } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{ borderTop: '1px solid var(--border-color)', padding: '3rem 0', background: 'var(--bg-secondary)' }}>
      <div className="container responsive-flex-col-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.25rem' }}>
          <div style={{ color: 'var(--accent-cyan)' }}>
            <Layers size={24} />
          </div>
          SafeDeck
        </div>
        <div className="mobile-text-center" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'right' }}>
          <div style={{ marginBottom: '0.5rem' }}>&copy; {new Date().getFullYear()} SafeDeck Inc. All rights reserved.</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>SafeDeck does not store your deal data. Processing is ephemeral. Full privacy policy available on request.</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
