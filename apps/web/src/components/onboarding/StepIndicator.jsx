import React from 'react';

const steps = ['Account', 'Profile', 'Criteria', 'Evaluation', 'Data', 'Test Deck', 'Dashboard'];

// completedSteps: optional map of {stepNum: bool} for server-confirmed completions
const StepIndicator = ({ currentStep, completedSteps = {} }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 0, marginBottom: '2rem', overflow: 'hidden' }}>
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        // A step is completed if we've passed it OR the server says so
        const isCompleted = currentStep > stepNum || completedSteps[stepNum] === true;
        const isActive = currentStep === stepNum;

        return (
          <React.Fragment key={label}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: 700,
                transition: 'all 0.3s ease',
                background: isCompleted
                  ? 'var(--accent-cyan)'
                  : isActive
                    ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))'
                    : 'rgba(255,255,255,0.05)',
                border: isActive
                  ? '2px solid var(--accent-cyan)'
                  : isCompleted
                    ? '2px solid var(--accent-cyan)'
                    : '2px solid rgba(255,255,255,0.1)',
                color: isCompleted || isActive ? '#000' : 'var(--text-secondary)',
                boxShadow: isActive ? '0 0 20px rgba(6, 182, 212, 0.4)' : isCompleted ? '0 0 10px rgba(6, 182, 212, 0.2)' : 'none',
              }}>
                {isCompleted ? '✓' : stepNum}
              </div>
              <span style={{
                fontSize: '0.62rem',
                color: isCompleted ? 'var(--accent-cyan)' : isActive ? 'white' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 400,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{
                height: '2px',
                width: 'clamp(8px, 1.8vw, 24px)',
                marginBottom: '1.2rem',
                background: currentStep > stepNum
                  ? 'var(--accent-cyan)'
                  : 'rgba(255,255,255,0.08)',
                transition: 'background 0.4s ease',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;
