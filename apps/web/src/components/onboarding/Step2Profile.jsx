import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { saveFundProfile } from '../../utils/api';

const slideVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const inputStyle = (focused, field) => ({
  width: '100%',
  padding: '0.85rem 1rem',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${focused === field ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
  borderRadius: '10px',
  color: 'white',
  fontSize: '0.95rem',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  transition: 'border-color 0.2s ease',
});

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '0.4rem',
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
};

const volumeOptions = ['1–20', '20–50', '50–100', '100+'];

const SECTORS = [
  'Climate Tech', 'Health', 'Agri', 'FinTech', 'EdTech',
  'Consumer', 'Deep Tech', 'Enterprise', 'Other',
];

const STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B'];

const MultiSelect = ({ label, options, selected, onToggle }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {options.map(opt => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: isSelected ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)',
              background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255,255,255,0.03)',
              color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontWeight: isSelected ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {isSelected ? '✓ ' : ''}{opt}
          </button>
        );
      })}
    </div>
  </div>
);

const Step2Profile = ({ onNext, data, setData, user }) => {
  const [focused, setFocused] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isReturning = user && !user.isNewUser;

  React.useEffect(() => {
    const saved = user?.user || {};
    setData(prev => ({
      fundName: prev.fundName || saved.fund_name || '',
      role: prev.role || saved.role || '',
      website: prev.website || saved.website || '',
      volume: prev.volume || saved.decks_per_month || '',
      thesis: prev.thesis || saved.thesis || '',
      sectors: prev.sectors || saved.sectors || [],
      stages: prev.stages || saved.stages || [],
    }));
  }, [user]);

  const handleChange = (key, val) => setData(prev => ({ ...prev, [key]: val }));

  const toggleSector = (sector) =>
    setData(prev => ({
      ...prev,
      sectors: prev.sectors.includes(sector)
        ? prev.sectors.filter(s => s !== sector)
        : [...prev.sectors, sector],
    }));

  const toggleStage = (stage) =>
    setData(prev => ({
      ...prev,
      stages: prev.stages.includes(stage)
        ? prev.stages.filter(s => s !== stage)
        : [...prev.stages, stage],
    }));

  const isValid = data.fundName && data.role && data.volume;

  const handleContinue = async () => {
    if (!isValid) return;
    setSaving(true);
    setError('');
    try {
      await saveFundProfile({
        userId: user?.userId,
        email: user?.email,
        fundName: data.fundName,
        role: data.role,
        website: data.website,
        volume: data.volume,
        thesis: data.thesis,
        sectors: data.sectors,
        stages: data.stages,
      });
      onNext();
    } catch (err) {
      console.error('Failed to save fund profile:', err);
      setError('Failed to save. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }}>
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: isReturning ? 'rgba(16, 185, 129, 0.06)' : 'rgba(6, 182, 212, 0.05)', border: `1px solid ${isReturning ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.15)'}`, borderRadius: '10px', marginBottom: '1.5rem' }}>
          {user.picture && <img src={user.picture} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{user.email}</div>
          </div>
          <div style={{ marginLeft: 'auto', padding: '0.25rem 0.6rem', background: isReturning ? 'rgba(16, 185, 129, 0.12)' : 'rgba(6, 182, 212, 0.1)', border: `1px solid ${isReturning ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 182, 212, 0.2)'}`, borderRadius: '6px', color: isReturning ? '#10b981' : 'var(--accent-cyan)', fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {isReturning ? '↩ Welcome back!' : '✓ Verified'}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', marginBottom: '0.3rem' }}>
          {isReturning ? 'Update your fund details' : 'Tell us about your fund'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          {isReturning ? 'Your saved details are pre-filled — update anything that has changed.' : 'This helps us personalise your SafeDeck experience.'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {/* Fund Name */}
        <div>
          <label style={labelStyle}>Fund Name <span style={{ color: 'var(--accent-red)' }}>*</span></label>
          <input
            style={inputStyle(focused, 'fundName')}
            placeholder="e.g. Blume Ventures, Titan Capital"
            value={data.fundName || ''}
            onChange={e => handleChange('fundName', e.target.value)}
            onFocus={() => setFocused('fundName')}
            onBlur={() => setFocused(null)}
          />
        </div>

        {/* Role */}
        <div>
          <label style={labelStyle}>Your Role <span style={{ color: 'var(--accent-red)' }}>*</span></label>
          <input
            style={inputStyle(focused, 'role')}
            placeholder="e.g. Partner, Analyst, Operations"
            value={data.role || ''}
            onChange={e => handleChange('role', e.target.value)}
            onFocus={() => setFocused('role')}
            onBlur={() => setFocused(null)}
          />
        </div>

        {/* Website */}
        <div>
          <label style={labelStyle}>Fund Website</label>
          <input
            style={inputStyle(focused, 'website')}
            placeholder="https://yourfund.com"
            value={data.website || ''}
            onChange={e => handleChange('website', e.target.value)}
            onFocus={() => setFocused('website')}
            onBlur={() => setFocused(null)}
          />
        </div>

        {/* Volume */}
        <div>
          <label style={labelStyle}>Pitch decks received per month <span style={{ color: 'var(--accent-red)' }}>*</span></label>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            {volumeOptions.map(opt => (
              <button
                key={opt}
                onClick={() => handleChange('volume', opt)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: data.volume === opt ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)',
                  background: data.volume === opt ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255,255,255,0.03)',
                  color: data.volume === opt ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontSize: '0.88rem',
                  fontWeight: data.volume === opt ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.25rem 0' }} />

        {/* Fund Thesis */}
        <div>
          <label style={labelStyle}>Fund Thesis <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400, textTransform: 'none' }}>— what you invest in and why</span></label>
          <textarea
            style={{ ...inputStyle(focused, 'thesis'), resize: 'vertical', minHeight: '80px', lineHeight: 1.5 }}
            placeholder="e.g. We invest in climate tech solving industrial decarbonisation at Series A — focused on hard tech with proven unit economics"
            value={data.thesis || ''}
            onChange={e => handleChange('thesis', e.target.value)}
            onFocus={() => setFocused('thesis')}
            onBlur={() => setFocused(null)}
          />
          <div style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {(data.thesis || '').length} / 500
          </div>
        </div>

        {/* Sectors */}
        <MultiSelect
          label="Investment Focus — Sectors"
          options={SECTORS}
          selected={data.sectors || []}
          onToggle={toggleSector}
        />

        {/* Stages */}
        <MultiSelect
          label="Investment Focus — Stages"
          options={STAGES}
          selected={data.stages || []}
          onToggle={toggleStage}
        />
      </div>

      {error && (
        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
          ❌ {error}
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!isValid || saving}
        style={{
          marginTop: '1.5rem',
          padding: '0.9rem 2rem',
          background: isValid && !saving ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))' : 'rgba(255,255,255,0.08)',
          color: isValid && !saving ? 'white' : 'var(--text-secondary)',
          border: 'none',
          borderRadius: '10px',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: isValid && !saving ? 'pointer' : 'not-allowed',
          float: 'right',
          fontFamily: 'Inter, sans-serif',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        {saving && <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
        {saving ? 'Saving...' : 'Continue →'}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
};

export default Step2Profile;
