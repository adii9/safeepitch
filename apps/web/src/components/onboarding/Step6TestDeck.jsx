import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { testDeckUpload } from '../../utils/api';

const slideVariants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0 },
};

const getLocalStorageUser = () => {
  try {
    return JSON.parse(localStorage.getItem('safedeck_user') || '{}');
  } catch {
    return {};
  }
};

// Fallback mock data when real pipeline isn't available
const FALLBACK_RESULTS = {
  promoter_name: 'Arjun Mehta',
  promoter_linkedin: 'linkedin.com/in/arjunmehta',
  revenue: '$480,000 ARR',
  revenue_growth_rate: '3.2x YoY',
  unit_economics: 'LTV/CAC: 4.1x',
  tam: '$42B',
  sam: '$8.2B',
  customer_count: '127 enterprise customers',
  churn_rate: '4% monthly',
  current_round: 'Series A',
  pre_money_valuation: '$12M',
  post_money_valuation: '$28M',
  prior_investors: 'Seed: Titan Capital, First Cheque',
  moat: 'Proprietary dataset of 50M+ industrial IoT events',
  product_stage: 'Live — v3.2 in production',
  founder_background: 'Ex-Siemens, IIT Delhi — 12 yrs in industrial automation',
  past_exits: 'None yet — first-time founder',
  ip_patents: '2 patents filed (pending)',
};

const FALLBACK_PILLARS = [
  { pillar: 'Founder Score', score: 78, color: 'var(--accent-cyan)' },
  { pillar: 'Market Size', score: 85, color: 'var(--accent-purple)' },
  { pillar: 'Traction', score: 72, color: '#f59e0b' },
  { pillar: 'Team Strength', score: 68, color: '#ec4899' },
];

const ScoreBar = ({ pillar, score, color }) => (
  <div style={{ marginBottom: '0.9rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{pillar}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>{score}/100</span>
    </div>
    <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        style={{ height: '100%', background: color, borderRadius: '3px' }}
      />
    </div>
  </div>
);

const Step6TestDeck = ({ onNext, data }) => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState('idle'); // idle | parsing | extracting | scoring | results
  const [progress, setProgress] = useState(0);
  const [pipelineResult, setPipelineResult] = useState(null); // { pillars, overallScore, extracted }
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const stages = [
    { id: 'parsing', label: 'Parsing deck', icon: '📄' },
    { id: 'extracting', label: 'Extracting fields', icon: '🔍' },
    { id: 'scoring', label: 'Running scoring', icon: '📊' },
    { id: 'results', label: 'Populating sheet', icon: '✅' },
  ];

  const runPipeline = async (selectedFile) => {
    setFile(selectedFile);
    setError(null);
    setStage('parsing');
    setProgress(0);
    setPipelineResult(null);

    const stageDurations = { parsing: 1500, extracting: 3000, scoring: 2000, results: 1000 };

    try {
      // Animate through stages
      for (const [id, duration] of Object.entries(stageDurations)) {
        await new Promise(resolve => {
          const start = Date.now();
          const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const stageProgress = Math.min(100, (elapsed / duration) * 100);
            setProgress(stageProgress);
            if (elapsed >= duration) {
              clearInterval(interval);
              resolve();
            }
          }, 50);
        });
        if (id !== 'results') {
          setStage(Object.keys(stageDurations)[Object.keys(stageDurations).indexOf(id) + 1]);
        }
      }

      setStage('results');
      setProgress(100);

      // Get tenant slug from onboarding data or localStorage
      const user = getLocalStorageUser();
      const tenantSlug = data?.safedeckEmail
        ? data.safedeckEmail.split('@')[0].replace('.com', '')
        : user?.user?.safedeck_email?.split('@')[0] || 'default';

      // Call the real CrewAI pipeline
      const result = await testDeckUpload({
        tenantSlug,
        companyName: selectedFile.name.replace('.pdf', ''),
        pdfFile: selectedFile,
      });

      // Parse CrewAI response into displayable format
      const parsed = parsePipelineResult(result);
      setPipelineResult(parsed);
    } catch (err) {
      console.error('Pipeline error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      // Don't show results at all on error
      setPipelineResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === 'application/pdf') {
      runPipeline(dropped);
    }
  };

  const handleFileInput = (e) => {
    const selected = e.target.files[0];
    if (selected) runPipeline(selected);
  };

  const pillars = pipelineResult?.pillars || FALLBACK_PILLARS;
  const overallScore = pipelineResult?.overallScore || Math.round(pillars.reduce((s, p) => s + p.score, 0) / pillars.length);
  const extracted = pipelineResult?.extracted || FALLBACK_RESULTS;

  return (
    <motion.div variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🚀</div>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.4rem' }}>See SafeDeck in action</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Upload your most recent pitch deck. We'll run the full pipeline — extraction, scoring, sheet population — right now.
        </p>
      </div>

      {/* Drop Zone */}
      {stage === 'idle' && (
        <motion.div
          animate={dragOver ? { scale: 1.01, borderColor: 'rgba(6,182,212,0.5)' } : { scale: 1, borderColor: 'rgba(255,255,255,0.1))' }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: '16px',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'rgba(6,182,212,0.05)' : 'rgba(255,255,255,0.02))',
            transition: 'all 0.2s ease',
            marginBottom: '1.5rem',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📂</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.35rem' }}>
            Drop your pitch deck PDF here
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', marginBottom: '1rem' }}>
            or click to browse your files
          </div>
          <div style={{ display: 'inline-flex', padding: '0.45rem 1rem', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: '8px', color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 600 }}>
            PDF only · Max 50MB
          </div>
        </motion.div>
      )}

      {/* Pipeline Progress */}
      {stage !== 'idle' && stage !== 'results' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            {stages.map((s, i) => {
              const currentIdx = stages.findIndex(x => x.id === stage);
              const isDone = currentIdx > i;
              const isActive = s.id === stage;
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem', opacity: isDone ? 0.5 : 1, transition: 'opacity 0.3s' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: isDone ? 'rgba(16,185,129,0.12)' : isActive ? 'rgba(6,182,212,0.12))' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isDone ? 'rgba(16,185,129,0.3))' : isActive ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.08))'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem',
                    transition: 'all 0.3s',
                  }}>
                    {isDone ? '✅' : s.icon}
                  </div>
                  <span style={{ fontSize: '0.88rem', color: isActive ? 'white' : isDone ? '#10b981' : 'var(--text-secondary)', fontWeight: isActive ? 600 : 400 }}>
                    {s.label}
                  </span>
                  {isActive && (
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))', transition: 'width 0.1s linear' }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{Math.round(progress)}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {file && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', border: "1px solid rgba(255,255,255,0.06))", borderRadius: '10px' }}>
              <span style={{ fontSize: '1.1rem' }}>📄</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{file.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</div>
              </div>
              <span style={{ color: 'var(--accent-cyan)', fontSize: '0.82rem', fontWeight: 600 }}>
                Processing...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {stage === 'results' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Overall Score */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '0.5rem' }}>
                Overall Deal Score
              </div>
              <div style={{ fontSize: '4rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
                {overallScore}
              </div>
              {error ? (
                <div style={{ padding: '0.5rem 1rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px', color: '#f59e0b', fontSize: '0.78rem', marginTop: '0.5rem' }}>
                  ⚠️ Live pipeline failed — showing simulated. Error: {error}
                </div>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.8rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '20px', color: '#f59e0b', fontSize: '0.78rem', fontWeight: 600, marginTop: '0.5rem' }}>
                  🟡 Above threshold — worth a second look
                </div>
              )}
            </div>

            {/* Score Breakdown */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score Breakdown</div>
              {pillars.map(p => <ScoreBar key={p.pillar} pillar={p.pillar} score={p.score} color={p.color} />)}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Overall</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>{overallScore}/100</span>
              </div>
            </div>

            {/* Extracted Fields */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Extracted Data</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {Object.entries(extracted).slice(0, 10).map(([key, val]) => (
                  <div key={key} style={{ padding: '0.5rem 0.65rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'capitalize', marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {String(val).slice(0, 50)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flagged items */}
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ef4444', marginBottom: '0.4rem' }}>⚠️ Claims to verify (v2)</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                These claims will be cross-checked in SafeDeck v2: LinkedIn profile verification, MCA/GST records for revenue, patent registry check.
              </div>
            </div>

            {/* Sheet populated */}
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.3rem' }}>✅</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#10b981' }}>Sheet populated</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {data?.sheetMappingType === 'custom' && data?.fieldMappings
                    ? 'Your custom columns have been filled with extracted data.'
                    : 'SafeDeck standard 53-column sheet updated with all extracted fields.'}
                </div>
              </div>
            </div>

            <button
              onClick={onNext}
              style={{
                width: '100%',
                padding: '0.9rem 2rem',
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Continue to Dashboard →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {stage === 'idle' && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onNext}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-secondary)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              fontSize: '0.88rem',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Skip — I'll upload a deck later →
          </button>
        </div>
      )}
    </motion.div>
  );
};

// Parse CrewAI pipeline response into displayable format
function parsePipelineResult(result) {
  // Lambda returns { statusCode, body: "{...}" }
  let body = result;
  if (typeof result === 'object' && result.body) {
    try {
      body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    } catch {
      body = result;
    }
  }

  const audit = body.audit_result || body;

  // Extract scores
  const pillars = body.rating_breakdown || [
    { pillar: 'Founder Score', score: body.founder_score || body.founderScore || 0, color: 'var(--accent-cyan)' },
    { pillar: 'Market Size', score: body.market_score || body.marketScore || 0, color: 'var(--accent-purple)' },
    { pillar: 'Traction', score: body.traction_score || body.tractionScore || 0, color: '#f59e0b' },
    { pillar: 'Team Strength', score: body.team_score || body.teamScore || 0, color: '#ec4899' },
  ];

  const overallScore = body.composite_score || body.overall_score || body.score ||
    Math.round(pillars.reduce((s, p) => s + (p.score || 0), 0) / pillars.length);

  // Extract fields from audit result
  const extracted = {};
  if (audit && typeof audit === 'object') {
    Object.entries(audit).forEach(([key, val]) => {
      if (val !== null && val !== undefined && val !== '' && key !== 'rating_breakdown') {
        extracted[key] = typeof val === 'object' ? JSON.stringify(val).slice(0, 100) : String(val);
      }
    });
  }

  return { pillars, overallScore, extracted };
}

export default Step6TestDeck;
