import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { saveRatingConfiguration } from '../../utils/api';

const slideVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const FIELD_SCHEMA = {
  Founder: {
    promoter_name: 'Promoter / Founder Name',
    promoter_linkedin: 'Founder LinkedIn URL',
    founder_background: 'Founder Background',
    founder_education: 'Founder Education',
    past_exits: 'Past Exits',
    two_x_founder_flag: '2X Founder Flag',
    founder_age: 'Founder Age',
    founder_tenure: 'Founder Tenure in Company',
  },
  Market: {
    tam: 'TAM (Total Addressable Market)',
    sam: 'SAM (Serviceable Addressable Market)',
    som: 'SOM (Serviceable Obtainable Market)',
    problem_size: 'Problem Size',
    market_growth_rate: 'Market Growth Rate',
    market_evidence: 'Market Evidence / Citations',
    geo_target: 'Geographic Target',
    regulatory_tailwinds: 'Regulatory Tailwinds',
  },
  Traction: {
    revenue: 'Revenue',
    revenue_growth_rate: 'Revenue Growth Rate',
    unit_economics: 'Unit Economics (LTV/CAC)',
    burn_rate: 'Burn Rate',
    runway: 'Runway (months)',
    customer_count: 'Customer Count',
    customer_concentration: 'Customer Concentration',
    churn_rate: 'Churn Rate',
    net_retention: 'Net Retention',
    annual_contract_value: 'Annual Contract Value (ACV)',
    annual_recurring_revenue: 'ARR',
    mrr_growth: 'MRR Growth',
    gross_margin: 'Gross Margin',
  },
  Competition: {
    competitors_listed: 'Competitors Listed',
    competitive_landscape: 'Competitive Landscape',
    moat: 'Moat / Defensibility',
    ip_patents: 'IP / Patents',
    switching_cost: 'Switching Cost',
    market_share: 'Current Market Share',
  },
  Fundraising: {
    current_round: 'Current Fundraising Round',
    amount_raising: 'Amount Raising',
    pre_money_valuation: 'Pre-money Valuation',
    post_money_valuation: 'Post-money Valuation',
    cap_table: 'Cap Table Summary',
    prior_investors: 'Prior Investors',
    use_of_funds: 'Use of Funds',
    dilution: 'Dilution %',
    investment_multiple: 'Target Investment Multiple',
    option_pool: 'Option Pool %',
  },
  Product: {
    product_stage: 'Product Stage',
    product_differentiation: 'Product Differentiation',
    tech_stack: 'Tech Stack',
    product_feedback: 'Customer Product Feedback',
    product_roadmap: 'Product Roadmap',
    integration_ecosystem: 'Integration Ecosystem',
    data_advantage: 'Data Advantage',
    scalability: 'Scalability',
    time_to_value: 'Time to Value (TTV)',
    nps_score: 'NPS Score',
  },
};

const getLabel = (key) => {
  for (const cat of Object.values(FIELD_SCHEMA)) {
    if (cat[key]) return cat[key];
  }
  return key; // fallback
};

const Step4Rating = ({ onNext, data, setData, user }) => {
  const [weights, setWeights] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Extract 'Must have' fields assigned in Step 3
  const mustHaves = data?.evaluationCriteria?.must_have || [];

  // Initialize weights if not exists
  useEffect(() => {
    const initialWeights = { ...data?.ratingWeights };
    let changed = false;
    mustHaves.forEach(field => {
      if (initialWeights[field] === undefined) {
        initialWeights[field] = 5; // Default middle-of-road 5/10 weight
        changed = true;
      }
    });

    // Cleanup keys that are no longer must-haves
    Object.keys(initialWeights).forEach(key => {
      if (!mustHaves.includes(key)) {
        delete initialWeights[key];
        changed = true;
      }
    });

    if (changed) {
      setWeights(initialWeights);
    } else if (Object.keys(weights).length === 0 && Object.keys(initialWeights).length > 0) {
      setWeights(initialWeights);
    }
  }, [mustHaves, data?.ratingWeights]);

  const handleWeightChange = (field, value) => {
    setWeights(prev => ({ ...prev, [field]: parseInt(value, 10) }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await saveRatingConfiguration({
        userId: user?.userId,
        email: user?.email,
        ratingWeights: weights,
      });

      setData(prev => ({
        ...prev,
        ratingWeights: weights,
      }));
      onNext();
    } catch (err) {
      console.error('Failed to save rating weights:', err);
      setError('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.4rem' }}>⚖️</span>
          <h2 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', margin: 0 }}>Define Scoring Weights</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Assign an importance weight (1-10 points) to each of your <strong>Must-Have</strong> criteria. 
          SafeDeck uses these weights to calculate an automated score for each analyzed startup.
        </p>
      </div>

      {mustHaves.length === 0 ? (
        <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          You did not select any <strong>"Must have"</strong> criteria in Step 3. You can still proceed, or go back to prioritize specific fields for rating.
        </div>
      ) : (
        <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.25rem' }}>
          {mustHaves.map(field => {
            const val = weights[field] || 5;
            return (
              <div key={field} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.85rem 1.1rem', marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {getLabel(field)}
                  </div>
                  <div style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {val} PT{val !== 1 ? 'S' : ''}
                  </div>
                </div>
                
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={val}
                  onChange={(e) => handleWeightChange(field, e.target.value)}
                  style={{ width: '100%', cursor: 'pointer', appearance: 'none', background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', outline: 'none' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  <span>Low Impact (1)</span>
                  <span>Critical (10)</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: var(--accent-cyan);
          cursor: pointer;
          margin-top: -6px;
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 6px;
          cursor: pointer;
          background: transparent;
        }
      `}</style>
    </motion.div>
  );
};

export default Step4Rating;
