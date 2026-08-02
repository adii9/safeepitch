import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Users, DollarSign, TrendingUp, Building2, AlertCircle, ShieldCheck, CheckCircle2, ExternalLink, Link as LinkIcon, MapPin, FileText, Search, Clock, ThumbsUp, AlertTriangle, ArrowRight, Globe, Zap, Check, XCircle } from 'lucide-react';

// Field key → human-readable label
const FIELD_LABELS = {
  // Business Overview
  revenue: 'Revenue',
  revenue_growth_rate: 'Revenue Growth',
  burn_rate: 'Burn Rate',
  runway: 'Runway',
  competitive_landscape: 'Competitive Landscape',
  tam: 'TAM',
  sam: 'SAM',
  som: 'SOM',
  // Financial Profile
  amount_raising: 'Amount Raising',
  current_round: 'Current Round',
  pre_money_valuation: 'Pre-Money Valuation',
  total_fund_raised: 'Total Fund Raised',
  // Team
  promoter_name: 'Promoters / Founders',
  promoter_linkedin: 'Founder LinkedIn',
  senior_team: 'Senior Team',
  prior_experience: 'Prior Experience',
  educational_experience: 'Education',
};

// Fields that should render as text blocks (long content), not rows
const TEXT_BLOCK_FIELDS = new Set([
  'competitive_landscape',
  'prior_experience',
  'educational_experience',
  'senior_team',
]);

// Section groupings — fields shown in each section
const SECTIONS = [
  {
    id: 'business',
    label: 'Business Overview',
    icon: <Target size={16} color="var(--accent-purple)" />,
    fields: ['competitive_landscape', 'revenue', 'revenue_growth_rate', 'burn_rate', 'runway'],
  },
  {
    id: 'market',
    label: 'Market & Competition',
    icon: <TrendingUp size={16} color="#60a5fa" />,
    fields: ['tam', 'sam', 'som', 'competitors_listed'],
  },
  {
    id: 'funding',
    label: 'Funding & Capital',
    icon: <Building2 size={16} color="#f59e0b" />,
    fields: ['amount_raising', 'pre_money_valuation', 'current_round', 'total_fund_raised'],
  },
  {
    id: 'team',
    label: 'Team & Background',
    icon: <Users size={16} color="var(--accent-green)" />,
    fields: ['promoter_name', 'promoter_linkedin', 'senior_team', 'prior_experience', 'educational_experience'],
  },
];

const SectionHead = ({ icon, label, color = 'var(--text-primary)' }) => (
  <h3 style={{
    display: 'flex', alignItems: 'center', gap: '0.45rem',
    color, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.3px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '0.5rem', marginBottom: '1.1rem'
  }}>
    {icon} {label}
  </h3>
);

const SourceBadge = ({ url }) => {
  if (!url || url === 'N/A' || url === 'Not found in public domain') return null;

  // Pitch deck fields — badge with purple tint, still visible
  if (url === 'pitch_deck') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
        fontSize: '0.7rem', color: '#a78bfa', fontWeight: 500, marginTop: '0.2rem'
      }}>
        <FileText size={10} /> Pitch Deck <ExternalLink size={9} />
      </span>
    );
  }

  // Real web URL — extract hostname safely even for URLs with extra paths
  let hostname = url;
  try {
    const parsed = new URL(url);
    hostname = parsed.hostname.replace('www.', '');
  } catch {
    // If URL is malformed (e.g. "https://www.linkedin.com/in/sejal-agarwal6/ (Sejal)"),
    // extract hostname manually from the part before any path or space
    const match = url.match(/^(https?:\/\/[^\/]+)/);
    if (match) {
      hostname = match[1].replace(/^(https?:\/\/)/, '').replace('www.', '');
    } else {
      hostname = url;
    }
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
      fontSize: '0.7rem', color: '#3b82f6', textDecoration: 'none', opacity: 0.85,
      fontWeight: 500, marginTop: '0.2rem'
    }}>
      <ExternalLink size={10} /> via {hostname}
    </a>
  );
};

const FactRow = ({ label, value, sourceUrl, isVerified }) => {
  const strVal = typeof value === 'string' || typeof value === 'number' ? value : null;
  const empty = strVal === 'Not stated' || strVal === '' || strVal === 'N/A' || strVal == null;
  if (empty) return null;

  return (
    <div style={{ paddingBottom: '0.8rem', borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flexShrink: 0 }}>{label}</span>
        <span style={{ textAlign: 'right', fontSize: '0.92rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          {strVal}
        </span>
      </div>
      {isVerified && sourceUrl && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <SourceBadge url={sourceUrl} />
        </div>
      )}
    </div>
  );
};

const FactBlock = ({ label, value, sourceUrl, isVerified }) => {
  const empty = value === 'Not stated' || value === '' || value === 'N/A' || value == null;
  if (empty) return null;

  return (
    <div>
      <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 0.45rem 0' }}>
        {label}
      </h4>
      <p style={{ fontSize: '0.92rem', lineHeight: 1.75, color: 'var(--text-primary)', margin: 0 }}>{value}</p>
      {isVerified && sourceUrl && <SourceBadge url={sourceUrl} />}
    </div>
  );
};

// ─── NEW: Quick Stats Bar ───────────────────────────────────────────────────
const QuickStatsBar = ({ details, verifiedData, score }) => {
  const totalFields = Object.keys(details || {}).filter(k => {
    const v = details[k];
    return v !== undefined && v !== null && v !== 'Not stated' && v !== '' && v !== 'N/A';
  }).length;

  const verifiedFields = Object.keys(verifiedData || {}).filter(k => {
    const vd = verifiedData[k];
    return vd && vd.source_url && vd.source_url !== 'N/A' && vd.source_url !== 'Not found in public domain';
  }).length;

  const pitchDeckSources = Object.keys(verifiedData || {}).filter(k => {
    const vd = verifiedData[k];
    return vd && vd.source_url === 'pitch_deck';
  }).length;

  const discrepancyFields = Object.keys(verifiedData || {}).filter(k => {
    const vd = verifiedData[k];
    return vd && vd.value && vd.value !== details[k] && vd.value !== 'Not stated';
  }).length;

  const stats = [
    { label: 'Fields Extracted', value: totalFields, icon: <FileText size={12} />, color: '#8b5cf6' },
    { label: 'Verified Online', value: verifiedFields, icon: <Globe size={12} />, color: '#10b981' },
    { label: 'From Pitch Deck', value: pitchDeckSources, icon: <FileText size={12} />, color: '#6b7280' },
    { label: 'With Discrepancies', value: discrepancyFields, icon: <AlertTriangle size={12} />, color: discrepancyFields > 0 ? '#f59e0b' : '#6b7280' },
  ];

  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
      {stats.map((stat, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.3rem 0.65rem',
          background: `${stat.color}18`,
          border: `1px solid ${stat.color}33`,
          borderRadius: '20px',
          fontSize: '0.72rem',
          color: stat.color,
          fontWeight: 600,
        }}>
          {stat.icon} {stat.value} {stat.label}
        </div>
      ))}
    </div>
  );
};

// ─── NEW: Verification Trace ────────────────────────────────────────────────
const VerificationTrace = ({ details, verifiedData }) => {
  if (!verifiedData || Object.keys(verifiedData).length === 0) return null;

  // Collect all fields that have verification data
  const verifiedEntries = Object.entries(verifiedData).filter(([key, vd]) => {
    if (!vd || !vd.value) return false;
    const claimed = details?.[key];
    return claimed !== undefined && claimed !== null && claimed !== 'Not stated';
  });

  if (verifiedEntries.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(139,92,246,0.04)',
      border: '1px solid rgba(139,92,246,0.18)',
      borderRadius: '14px',
      padding: '1.4rem',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        color: 'var(--accent-purple)', fontWeight: 700, fontSize: '0.82rem',
        textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.2rem'
      }}>
        <Search size={14} /> AI Verification Trace
      </div>

      {/* All sources at a glance */}
      {(() => {
        const allSources = [];
        verifiedEntries.forEach(([key, vd]) => {
          if (vd.source_url && vd.source_url !== 'N/A' && vd.source_url !== 'Not found in public domain' && !allSources.includes(vd.source_url)) {
            allSources.push(vd.source_url);
          }
        });
        if (allSources.length === 0) return null;
        return (
          <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'rgba(139,92,246,0.06)', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.15)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', fontWeight: 600 }}>Sources Used</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {allSources.map((src, i) => (
                <SourceBadge key={i} url={src} />
              ))}
            </div>
          </div>
        );
      })()}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {verifiedEntries.map(([key, vd]) => {
          const claimed = details?.[key] || 'Not stated';
          const verified = vd.value;
          const sourceUrl = vd.source_url;
          const hasDiscrepancy = verified !== claimed && verified !== 'Not stated' && claimed !== 'Not stated';

          return (
            <div key={key} style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px',
              border: `1px solid ${hasDiscrepancy ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.06)'}`,
              padding: '1rem 1.1rem',
            }}>
              {/* Claimed vs Verified */}
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                  Claimed in Deck
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  "{claimed}"
                </div>
              </div>

              {/* Arrow + Verified */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <ArrowRight size={13} color="var(--text-secondary)" />
                <div style={{
                  padding: '0.2rem 0.55rem',
                  background: hasDiscrepancy ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: hasDiscrepancy ? '#f59e0b' : '#10b981',
                }}>
                  {hasDiscrepancy ? `Verified: ${verified}` : verified}
                </div>
                {hasDiscrepancy && (
                  <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                    ← Discrepancy flagged
                  </span>
                )}
              </div>

              {/* Source */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <SourceBadge url={sourceUrl} />
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                  fontSize: '0.7rem',
                  color: hasDiscrepancy ? '#f59e0b' : '#10b981',
                  fontWeight: 600,
                }}>
                  {hasDiscrepancy ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
                  {hasDiscrepancy ? 'Needs Review' : 'Verified'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── NEW: Analysis Metadata ──────────────────────────────────────────────────
const AnalysisMetadata = ({ deck, score }) => {
  const metaItems = [
    { label: 'Company', value: deck.name, icon: <Building2 size={13} /> },
    { label: 'Analyzed', value: deck.date, icon: <Clock size={13} /> },
    { label: 'Sector', value: deck.sector && deck.sector !== 'General' ? deck.sector : 'Not specified', icon: <TrendingUp size={13} /> },
    { label: 'Status', value: deck.status, icon: <Zap size={13} /> },
  ];

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem',
      padding: '0.9rem 1.1rem',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {metaItems.map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          fontSize: '0.78rem',
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>{item.icon}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{item.label}:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
};

const DeckModal = ({ deck, onClose }) => {
  if (!deck) return null;

  const { details, verifiedData, riskAnalysis, score, reasoning } = deck;

  // Helper: get display value + source for a given field key
  const getFieldData = (key) => {
    const value = details[key];
    const vd = verifiedData && verifiedData[key];
    return {
      value,
      sourceUrl: vd ? vd.source_url : null,
      isVerified: !!vd && !!vd.source_url,
    };
  };

  // Build the list of fields present in a section
  const getPresentFields = (sectionFields) =>
    sectionFields.filter(key => {
      const val = details[key];
      return val !== undefined && val !== null && val !== 'Not stated' && val !== '' && val !== 'N/A';
    });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(6,8,14,0.9)', backdropFilter: 'blur(14px)',
          zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.25rem'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 36, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 18, opacity: 0, scale: 0.97 }}
          transition={{ type: 'spring', damping: 30, stiffness: 340 }}
          className="glass-panel"
          style={{
            width: '100%', maxWidth: '1080px', maxHeight: '92vh', overflowY: 'auto',
            background: 'var(--bg-secondary)', borderRadius: '22px', position: 'relative',
            border: '1px solid rgba(139,92,246,0.22)', boxShadow: '0 32px 64px -16px rgba(0,0,0,0.7)'
          }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* ── HEADER ── */}
          <div style={{
            padding: '1.6rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
            position: 'sticky', top: 0, background: 'rgba(11,14,22,0.97)',
            backdropFilter: 'blur(18px)', zIndex: 10
          }}>
            <button onClick={onClose} style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%', width: '34px', height: '34px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', cursor: 'pointer'
            }}>
              <X size={16} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.65rem' }}>
                  <span style={{ padding: '0.2rem 0.65rem', background: 'rgba(59,130,246,0.12)', borderRadius: '20px', color: '#60a5fa', fontSize: '0.74rem', fontWeight: 600 }}>
                    {deck.status}
                  </span>
                  {deck.sector && deck.sector !== 'General' && (
                    <span style={{ padding: '0.2rem 0.65rem', background: 'rgba(139,92,246,0.12)', borderRadius: '20px', color: 'var(--accent-purple)', fontSize: '0.74rem', fontWeight: 600 }}>
                      {deck.sector}
                    </span>
                  )}
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {deck.date}
                  </span>
                </div>

                <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: 0 }}>
                  {deck.name}
                </h2>

                {details?.website && details.website !== 'Not stated' && (
                  <a href={details.website} target="_blank" rel="noreferrer" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '0.85rem', marginTop: '0.5rem'
                  }}>
                    <LinkIcon size={13} /> {details.website}
                  </a>
                )}

                {/* Quick Stats Bar */}
                <QuickStatsBar details={details} verifiedData={verifiedData} score={score} />
              </div>

              {/* AI Score */}
              {score !== undefined && score !== null && (
                <div style={{
                  textAlign: 'center', padding: '0.9rem 1.1rem', flexShrink: 0,
                  background: score >= 70 ? 'rgba(16,185,129,0.07)' : score >= 40 ? 'rgba(245,158,11,0.07)' : 'rgba(239,68,68,0.07)',
                  border: `1px solid ${score >= 70 ? 'rgba(16,185,129,0.22)' : score >= 40 ? 'rgba(245,158,11,0.22)' : 'rgba(239,68,68,0.22)'}`,
                  borderRadius: '14px'
                }}>
                  <div style={{
                    fontSize: '2.5rem', fontWeight: 900, lineHeight: 1,
                    color: score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'
                  }}>
                    {score}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '1px', marginTop: '0.3rem', textTransform: 'uppercase' }}>
                    AI Score
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── BODY ── */}
          <div style={{ padding: '1.75rem 2rem', display: 'grid', gap: '2.25rem' }}>

            {/* Analysis Metadata */}
            <AnalysisMetadata deck={deck} score={score} />

            {/* AI Reasoning */}
            {reasoning && (
              <div style={{ background: 'rgba(139,92,246,0.05)', padding: '1.1rem 1.4rem', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.16)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-purple)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                  <Target size={14} /> AI Evaluation Summary
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--text-primary)' }}>{reasoning}</p>
              </div>
            )}

            {/* Red / Green flags */}
            {riskAnalysis && (riskAnalysis.red_flags?.length > 0 || riskAnalysis.green_flags?.length > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                {riskAnalysis.red_flags?.length > 0 && (
                  <div>
                    <SectionHead icon={<AlertCircle size={16} color="#ef4444" />} label="Identified Risks" color="#ef4444" />
                    <div style={{ display: 'grid', gap: '0.65rem' }}>
                      {riskAnalysis.red_flags.map((flag, i) => (
                        <div key={i} style={{ background: 'rgba(239,68,68,0.05)', padding: '0.75rem 0.9rem', borderRadius: '10px', borderLeft: '3px solid #ef4444' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.18rem' }}>{flag.flag}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{flag.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {riskAnalysis.green_flags?.length > 0 && (
                  <div>
                    <SectionHead icon={<ShieldCheck size={16} color="#10b981" />} label="Verified Strengths" color="#10b981" />
                    <div style={{ display: 'grid', gap: '0.65rem' }}>
                      {riskAnalysis.green_flags.map((flag, i) => (
                        <div key={i} style={{ background: 'rgba(16,185,129,0.05)', padding: '0.75rem 0.9rem', borderRadius: '10px', borderLeft: '3px solid #10b981' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.18rem' }}>{flag.flag}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{flag.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NEW: Verification Trace */}
            <VerificationTrace details={details} verifiedData={verifiedData} />

            {/* Dynamic sections grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
              {SECTIONS.map(section => {
                const presentFields = getPresentFields(section.fields);
                if (presentFields.length === 0) return null;

                return (
                  <section key={section.id}>
                    <SectionHead icon={section.icon} label={section.label} />
                    <div style={{ display: 'grid', gap: '1.4rem' }}>
                      {presentFields.map(key => {
                        const { value, sourceUrl, isVerified } = getFieldData(key);
                        const label = FIELD_LABELS[key] || key;

                        if (TEXT_BLOCK_FIELDS.has(key)) {
                          return (
                            <FactBlock
                              key={key}
                              label={label}
                              value={value}
                              sourceUrl={sourceUrl}
                              isVerified={isVerified}
                            />
                          );
                        }

                        // promoter_linkedin → render as link
                        if (key === 'promoter_linkedin') {
                          if (!value || value === 'Not stated') return null;
                          return (
                            <a
                              key={key}
                              href={value}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <ExternalLink size={11} /> Founder LinkedIn <ExternalLink size={10} />
                            </a>
                          );
                        }

                        // Default: FactRow
                        return (
                          <FactRow
                            key={key}
                            label={label}
                            value={value}
                            sourceUrl={sourceUrl}
                            isVerified={isVerified}
                          />
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DeckModal;