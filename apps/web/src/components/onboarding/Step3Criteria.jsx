import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { saveEvaluationCriteria } from '../../utils/api';

const slideVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '0.4rem',
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
};

// 53-field schema grouped by category
const FIELD_SCHEMA = {
  Founder: [
    { key: 'promoter_name', label: 'Promoter / Founder Name' },
    { key: 'promoter_linkedin', label: 'Founder LinkedIn URL' },
    { key: 'founder_background', label: 'Founder Background' },
    { key: 'founder_education', label: 'Founder Education' },
    { key: 'past_exits', label: 'Past Exits' },
    { key: 'two_x_founder_flag', label: '2X Founder Flag' },
    { key: 'founder_age', label: 'Founder Age' },
    { key: 'founder_tenure', label: 'Founder Tenure in Company' },
  ],
  Market: [
    { key: 'tam', label: 'TAM (Total Addressable Market)' },
    { key: 'sam', label: 'SAM (Serviceable Addressable Market)' },
    { key: 'som', label: 'SOM (Serviceable Obtainable Market)' },
    { key: 'problem_size', label: 'Problem Size' },
    { key: 'market_growth_rate', label: 'Market Growth Rate' },
    { key: 'market_evidence', label: 'Market Evidence / Citations' },
    { key: 'geo_target', label: 'Geographic Target' },
    { key: 'regulatory_tailwinds', label: 'Regulatory Tailwinds' },
  ],
  Traction: [
    { key: 'revenue', label: 'Revenue' },
    { key: 'revenue_growth_rate', label: 'Revenue Growth Rate' },
    { key: 'unit_economics', label: 'Unit Economics (LTV/CAC)' },
    { key: 'burn_rate', label: 'Burn Rate' },
    { key: 'runway', label: 'Runway (months)' },
    { key: 'customer_count', label: 'Customer Count' },
    { key: 'customer_concentration', label: 'Customer Concentration' },
    { key: 'churn_rate', label: 'Churn Rate' },
    { key: 'net_retention', label: 'Net Retention' },
    { key: 'annual_contract_value', label: 'Annual Contract Value (ACV)' },
    { key: 'annual_recurring_revenue', label: 'ARR' },
    { key: 'mrr_growth', label: 'MRR Growth' },
    { key: 'gross_margin', label: 'Gross Margin' },
  ],
  Competition: [
    { key: 'competitors_listed', label: 'Competitors Listed' },
    { key: 'competitive_landscape', label: 'Competitive Landscape' },
    { key: 'moat', label: 'Moat / Defensibility' },
    { key: 'ip_patents', label: 'IP / Patents' },
    { key: 'switching_cost', label: 'Switching Cost' },
    { key: 'market_share', label: 'Current Market Share' },
  ],
  Fundraising: [
    { key: 'current_round', label: 'Current Fundraising Round' },
    { key: 'amount_raising', label: 'Amount Raising' },
    { key: 'pre_money_valuation', label: 'Pre-money Valuation' },
    { key: 'post_money_valuation', label: 'Post-money Valuation' },
    { key: 'cap_table', label: 'Cap Table Summary' },
    { key: 'prior_investors', label: 'Prior Investors' },
    { key: 'use_of_funds', label: 'Use of Funds' },
    { key: 'dilution', label: 'Dilution %' },
    { key: 'investment_multiple', label: 'Target Investment Multiple' },
    { key: 'option_pool', label: 'Option Pool %' },
  ],
  Product: [
    { key: 'product_stage', label: 'Product Stage' },
    { key: 'product_differentiation', label: 'Product Differentiation' },
    { key: 'tech_stack', label: 'Tech Stack' },
    { key: 'product_feedback', label: 'Customer Product Feedback' },
    { key: 'product_roadmap', label: 'Product Roadmap' },
    { key: 'integration_ecosystem', label: 'Integration Ecosystem' },
    { key: 'data_advantage', label: 'Data Advantage' },
    { key: 'scalability', label: 'Scalability' },
    { key: 'time_to_value', label: 'Time to Value (TTV)' },
    { key: 'nps_score', label: 'NPS Score' },
  ],
};

const PRIORITY_OPTIONS = ['Must have', 'Nice to have', 'Ignore'];

const PriorityBadge = ({ priority }) => {
  const styles = {
    'Must have': { bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.3)', color: 'var(--accent-cyan)' },
    'Nice to have': { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.25)', color: 'var(--accent-purple)' },
    'Ignore': { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)' },
  };
  const s = styles[priority] || styles['Nice to have'];
  return (
    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '5px', background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: '0.68rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {priority}
    </span>
  );
};

const CategorySection = ({ category, fields, fieldPriorities, onPriorityToggle, isExpanded, onToggleExpand }) => {
  const selectedCount = fields.filter(f => fieldPriorities[f.key] === 'Must have').length;
  const niceCount = fields.filter(f => fieldPriorities[f.key] === 'Nice to have').length;

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden', marginBottom: '0.75rem' }}>
      {/* Category Header */}
      <div
        onClick={onToggleExpand}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.85rem 1.1rem',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: selectedCount > 0 ? 'var(--accent-cyan)' : niceCount > 0 ? 'var(--accent-purple)' : 'rgba(255,255,255,0.1)',
          flexShrink: 0,
          boxShadow: selectedCount > 0 ? '0 0 8px rgba(6,182,212,0.5)' : 'none',
          transition: 'all 0.3s',
        }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{category}</span>
          <span style={{ marginLeft: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {fields.length} fields
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {selectedCount > 0 && <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>✓{selectedCount} must-have</span>}
          {niceCount > 0 && <span style={{ fontSize: '0.72rem', color: 'var(--accent-purple)', fontWeight: 600 }}>•{niceCount} nice-to-have</span>}
        </div>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▾</span>
      </div>

      {/* Expandable Field List */}
      {isExpanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '0.75rem 1.1rem' }}>
          {fields.map(field => (
            <div key={field.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', flex: 1 }}>{field.label}</div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {PRIORITY_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => onPriorityToggle(field.key, opt)}
                    style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: fieldPriorities[field.key] === opt
                        ? (opt === 'Must have' ? 'var(--accent-cyan)' : opt === 'Nice to have' ? 'var(--accent-purple)' : 'rgba(255,255,255,0.15)')
                        : 'rgba(255,255,255,0.08)',
                      background: fieldPriorities[field.key] === opt
                        ? (opt === 'Must have' ? 'rgba(6,182,212,0.12)' : opt === 'Nice to have' ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.04)')
                        : 'transparent',
                      color: fieldPriorities[field.key] === opt
                        ? (opt === 'Must have' ? 'var(--accent-cyan)' : opt === 'Nice to have' ? 'var(--accent-purple)' : 'var(--text-secondary)')
                        : 'var(--text-secondary)',
                      fontSize: '0.72rem',
                      fontWeight: fieldPriorities[field.key] === opt ? 600 : 400,
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {fieldPriorities[field.key] === opt ? '✓ ' : ''}{opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Step3Criteria = ({ onNext, data, setData, user, alreadyConnected }) => {
  const [fieldPriorities, setFieldPriorities] = useState(() => {
    // Pre-load from saved data if available
    const saved = data.evaluationCriteria || {};
    const initial = {};
    Object.values(FIELD_SCHEMA).flat().forEach(f => {
      if (saved.must_have?.includes(f.key)) initial[f.key] = 'Must have';
      else if (saved.nice_to_have?.includes(f.key)) initial[f.key] = 'Nice to have';
      else if (saved.ignore?.includes(f.key)) initial[f.key] = 'Ignore';
      else initial[f.key] = 'Nice to have'; // default
    });
    return initial;
  });

  const [expandedCategory, setExpandedCategory] = useState('Founder');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handlePriorityToggle = (fieldKey, priority) => {
    setFieldPriorities(prev => ({ ...prev, [fieldKey]: priority }));
  };

  const mustHaveCount = Object.values(fieldPriorities).filter(p => p === 'Must have').length;
  const ignoreCount = Object.values(fieldPriorities).filter(p => p === 'Ignore').length;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const must_have = Object.entries(fieldPriorities)
        .filter(([, p]) => p === 'Must have').map(([k]) => k);
      const nice_to_have = Object.entries(fieldPriorities)
        .filter(([, p]) => p === 'Nice to have').map(([k]) => k);
      const ignore = Object.entries(fieldPriorities)
        .filter(([, p]) => p === 'Ignore').map(([k]) => k);

      await saveEvaluationCriteria({
        userId: user?.userId,
        email: user?.email,
        evaluationCriteria: { must_have, nice_to_have, ignore },
      });

      setData(prev => ({
        ...prev,
        evaluationCriteria: { must_have, nice_to_have, ignore },
      }));
      onNext();
    } catch (err) {
      console.error('Failed to save evaluation criteria:', err);
      setError('Failed to save criteria. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🎯</span>
          <h2 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', margin: 0 }}>What matters in your deal evaluation?</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Choose which fields SafeDeck should extract from pitch decks — and how important each one is. This shapes your pipeline priority and scoring.
        </p>
      </div>

      {/* Priority summary chips */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', fontSize: '0.78rem', fontWeight: 600 }}>
          🎯 {mustHaveCount} Must have
        </div>
        <div style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)', color: 'var(--accent-purple)', fontSize: '0.78rem', fontWeight: 600 }}>
          • {Object.values(fieldPriorities).filter(p => p === 'Nice to have').length} Nice to have
        </div>
        <div style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
          ⊘ {ignoreCount} Ignore
        </div>
      </div>

      {/* Field checklist by category */}
      <div style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '4px', marginBottom: '1.25rem' }}>
        {Object.entries(FIELD_SCHEMA).map(([category, fields]) => (
          <CategorySection
            key={category}
            category={category}
            fields={fields}
            fieldPriorities={fieldPriorities}
            onPriorityToggle={handlePriorityToggle}
            isExpanded={expandedCategory === category}
            onToggleExpand={() => setExpandedCategory(expandedCategory === category ? null : category)}
          />
        ))}
      </div>



      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
          ❌ {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          marginTop: '0.5rem',
          padding: '0.9rem 2rem',
          background: saving ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
          color: saving ? 'var(--text-secondary)' : 'white',
          border: 'none',
          borderRadius: '10px',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer',
          float: 'right',
          fontFamily: 'Inter, sans-serif',
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

export default Step3Criteria;
