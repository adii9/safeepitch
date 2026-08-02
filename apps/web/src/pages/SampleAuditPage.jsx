import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ThreeDPDFAudit from '../components/ThreeDPDFAudit';
import SampleAuditDashboard from '../components/SampleAuditDashboard';

const SampleAuditPage = () => {
  const [viewState, setViewState] = useState('3d-pdf');
  const navigate = useNavigate();

  const handleAnalyze = () => {
    // satisfying visual delay to simulate processing
    setTimeout(() => {
      setViewState('dashboard');
    }, 600);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <AnimatePresence mode="wait">
        {viewState === '3d-pdf' && (
          <motion.div
            key="3d"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 0.8 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <ThreeDPDFAudit onAnalyze={handleAnalyze} />
            <button 
              className="btn btn-secondary" 
              onClick={handleBack}
              style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 100, minHeight: '44px', padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Exit Demo
            </button>
          </motion.div>
        )}

        {viewState === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}
          >
            <SampleAuditDashboard onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SampleAuditPage;
