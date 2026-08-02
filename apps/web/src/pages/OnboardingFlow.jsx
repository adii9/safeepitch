import React, { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import StepIndicator from '../components/onboarding/StepIndicator';
import Step1Auth from '../components/onboarding/Step1Auth';
import Step2Profile from '../components/onboarding/Step2Profile';
import Step3Criteria from '../components/onboarding/Step3Criteria';
import Step4Rating from '../components/onboarding/Step4Rating';
import Step5DataSource from '../components/onboarding/Step5DataSource';

import Step6Done from '../components/onboarding/Step6Done';

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPaid = searchParams.get('paid') === 'true';

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('safedeck_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [formData, setFormData] = useState(() => {
    const savedUserStr = localStorage.getItem('safedeck_user');
    if (savedUserStr) {
      const u = JSON.parse(savedUserStr).user || {};
      return {
        fundName: u.fund_name || '',
        role: u.role || '',
        website: u.website || '',
        volume: u.decks_per_month || '',
        thesis: u.thesis || '',
        sectors: u.sectors || [],
        stages: u.stages || [],
        evaluationCriteria: u.evaluation_criteria || null,
        ratingWeights: u.rating_weights || {},
        dataSource: u.data_source || 'email_filter',
        safedeckEmail: u.safedeck_email || '',
      };
    }
    return {};
  });

  const [step, setStepRaw] = useState(() => {
    const isPaidParams = new URLSearchParams(window.location.search).get('paid') === 'true';
    const savedUserStr = localStorage.getItem('safedeck_user');
    const savedStep = localStorage.getItem('safedeck_onboarding_step');

    // If a step was already saved, always respect it (refresh resilience)
    if (savedUserStr && savedStep) {
      const saved = parseInt(savedStep, 10);
      if (saved >= 1 && saved <= 6) {
        return saved;
      }
    }

    // Paid users starting checkout flow go to step 2 (only if no step saved yet)
    if (isPaidParams && savedUserStr) {
      return 2;
    }

    return 1;
  });

  // Keep a ref to current step so setStep callback never closes over a stale value
  const stepRef = useRef(step);
  stepRef.current = step;

  // Persist step to localStorage so refresh resumes in the right place
  const setStep = (s) => {
    const stepNum = typeof s === 'function' ? s(stepRef.current) : s;
    localStorage.setItem('safedeck_onboarding_step', String(stepNum));
    setStepRaw(stepNum);
  };

  // Derive which integration steps are already complete from returning user's saved data
  const savedUser = user?.user || {};
  const completedSteps = {
    2: !!(savedUser.fund_name && savedUser.role),
    3: !!savedUser.evaluation_criteria,
    4: !!savedUser.rating_weights,
    5: !!savedUser.data_source,
  };

  // When Google auth completes on Step 1, seed formData from server-side user record
  const handleUserAuth = (userData) => {
    setUser(userData);
    const u = userData.user || {};
    setFormData({
      fundName: u.fund_name || '',
      role: u.role || '',
      website: u.website || '',
      volume: u.decks_per_month || '',
      thesis: u.thesis || '',
      sectors: u.sectors || [],
      stages: u.stages || [],
      evaluationCriteria: u.evaluation_criteria || null,
      ratingWeights: u.rating_weights || {},
      dataSource: u.data_source || 'email_filter',
      safedeckEmail: u.safedeck_email || '',
    });
  };

  const next = () => setStep(s => Math.min(s + 1, 6));

  // Jump directly to a specific step (for returning users clicking "Resume")
  const goToStep = (s) => setStep(s);

  const stepTitles = {
    1: 'Create your account',
    2: 'Fund profile & thesis',
    3: 'Evaluation criteria',
    4: 'Rating & scoring',
    5: 'Data source',
    6: "You're all set!",
  };

  const isReturning = user && !user.isNewUser;

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
    }}>
      {/* Background glow effects */}
      <div style={{ position: 'absolute', top: '-200px', left: '-200px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-200px', right: '-200px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: '1.5rem', left: '2rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SafeDeck</span>
      </div>

      {/* Returning user shortcut panel */}
      {isReturning && step >= 2 && step <= 6 && (
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '580px', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[2, 3, 4, 5].map(s => {
              if (completedSteps[s] && step !== s) {
                return (
                  <button
                    key={s}
                    onClick={() => goToStep(s)}
                    style={{ padding: '0.3rem 0.75rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '6px', color: '#10b981', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                  >
                    ✅ Step {s} — {['Profile', 'Criteria', 'Rating', 'Data'][s - 2]} (Done)
                  </button>
                );
              }
              if (!completedSteps[s] && step !== s) {
                return (
                  <button
                    key={s}
                    onClick={() => goToStep(s)}
                    style={{ padding: '0.3rem 0.75rem', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '6px', color: 'var(--accent-purple)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                  >
                    Resume Step {s} →
                  </button>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Main Card */}
      <div style={{
        width: '100%',
        maxWidth: '580px',
        background: 'rgba(15, 18, 24, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '24px',
        padding: 'clamp(1.5rem, 5vw, 2.5rem)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Step Indicator */}
        <StepIndicator currentStep={step} completedSteps={completedSteps} />

        {/* Step subtitle */}
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2rem', fontWeight: 600 }}>
          Step {step} of 6 — {stepTitles[step]}
        </p>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <div key={step} style={{ position: 'relative' }}>
            {step === 1 && (
              <Step1Auth
                onNext={next}
                onUserAuth={handleUserAuth}
              />
            )}
            {step === 2 && (
              <Step2Profile
                onNext={next}
                data={formData}
                setData={setFormData}
                user={user}
              />
            )}
            {step === 3 && (
              <Step3Criteria
                onNext={next}
                data={formData}
                setData={setFormData}
                user={user}
              />
            )}
            {step === 4 && (
              <Step4Rating
                onNext={next}
                data={formData}
                setData={setFormData}
                user={user}
              />
            )}
            {step === 5 && (
              <Step5DataSource
                onNext={next}
                data={formData}
                setData={setFormData}
                user={user}
              />
            )}
            {step === 6 && (
              <Step6Done data={formData} user={user} isPaid={isPaid} />
            )}
          </div>
        </AnimatePresence>

        <div style={{ clear: 'both' }} />
      </div>
    </div>
  );
};

export default OnboardingFlow;
