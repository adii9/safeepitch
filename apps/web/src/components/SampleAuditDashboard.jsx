import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Briefcase, TrendingUp, BarChart2, Database, Search } from 'lucide-react';

const mockData = {
  company: "Nexus Quantum",
  sector: "DeepTech / Quantum Computing",
  status: "Analyzed",
  financials: {
    revenue: "$1.2M",
    ebitda: "-$3.4M",
    valuation: "$60M Pre-Money",
    burnRate: "$450k/mo",
    runway: "8 Months"
  },
  market: {
    tam: "$45B by 2030",
    sam: "$4.5B",
    competition: "High - IBM, Google, Rigetti"
  },
  team: {
    founders: 3,
    technical: "Strong (2 PhDs from MIT)",
    domainExp: "10+ Years"
  },
  redFlags: [
    "Runway is under 12 months with current burn",
    "Dependency on untested supply chain for pure superconducting materials",
    "High founder equity dilution pre-Series A (Only 42% remaining)"
  ],
  greenFlags: [
    "Strong technical pedigree in founders",
    "Early traction with $1.2M ARR in hardware is exceptional",
    "Clear moat with 4 filed patents around ambient cooling"
  ]
};

const SectionData = ({ title, data }) => (
  <div className="glass-panel audit-card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', marginBottom: '1.5rem' }}>
    <h3 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.1rem)', marginBottom: '1.2rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      {title}
    </h3>
    <div className="audit-card-grid">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: 'var(--text-secondary)', textTransform: 'capitalize', marginBottom: '0.4rem' }}>
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </div>
          <div style={{ fontSize: 'clamp(1rem, 2vw, 1.1rem)', fontWeight: 600 }}>{value}</div>
        </div>
      ))}
    </div>
  </div>
);

const SampleAuditDashboard = ({ onBack }) => {
  return (
    <div style={{ minHeight: '100vh', padding: '2rem 5%', position: 'relative' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: '5%', left: '15%', width: '600px', height: '600px', background: 'var(--accent-blue)', filter: 'blur(250px)', opacity: 0.15, borderRadius: '50%', zIndex: -1 }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '500px', height: '500px', background: 'var(--accent-purple)', filter: 'blur(250px)', opacity: 0.1, borderRadius: '50%', zIndex: -1 }} />

      <header className="audit-board-header">
        <button className="btn btn-secondary" onClick={onBack} style={{ padding: '0.8rem 1.2rem', minHeight: '44px', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
          <ArrowLeft size={16} /> Back to Homepage
        </button>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--accent-green)', padding: '0.8rem 1.2rem', minHeight: '44px', borderRadius: '20px', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
             <CheckCircle size={16} /> Data Pushed to CRM
          </div>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container" style={{ maxWidth: '1200px' }}>
        <div className="audit-board-title">
          <div>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '0.2rem', letterSpacing: '-0.02em' }}>{mockData.company}</h1>
            <div style={{ color: 'var(--text-secondary)', fontSize: '1.15rem' }}>{mockData.sector}</div>
          </div>
          <div className="audit-board-time-block">
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Analyzed In</div>
            <div className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 700 }}>4.2 Seconds</div>
          </div>
        </div>

        <div className="audit-board-grid">
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <SectionData title={<><TrendingUp size={18} /> Financials & Metrics</>} data={mockData.financials} />
            <SectionData title={<><BarChart2 size={18} /> Market & Competition</>} data={mockData.market} />
            <SectionData title={<><Briefcase size={18} /> Team Profile</>} data={mockData.team} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <h3 style={{ color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
                <AlertTriangle size={18} /> Deep Red Flags
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {mockData.redFlags.map((flag, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    <XCircle size={18} color="var(--accent-red)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ lineHeight: 1.5 }}>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <h3 style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
                <CheckCircle size={18} /> Green Flags
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {mockData.greenFlags.map((flag, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    <CheckCircle size={18} color="var(--accent-green)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ lineHeight: 1.5 }}>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 SafeDeck Analyst Summary
              </h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Strong technology pure-play with exceptional early traction, however runway risks and supply chain fragility make the current $60M Pre-Money valuation ambitious. Recommended for Partner Review before term sheet.
              </p>
            </div>
          </div>
        </div>

        {/* AI Verification Trace */}
        <div className="glass-panel" style={{ marginTop: '2rem', padding: 'clamp(1.5rem, 3vw, 2.5rem)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
             <Search size={20} color="var(--accent-purple)" /> AI Verification Trace
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Claim Extracted</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '1rem', color: 'white' }}>"Reached $1.2M ARR in hardware sales"</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SOURCE</div>
                  <div style={{ fontSize: '0.95rem' }}>Pitch Deck, Slide 4, Paragraph 2</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>CROSS-REFERENCE</div>
                  <div style={{ fontSize: '0.95rem' }}>Matches Tracxn and recent robust PR announcements — <span style={{color: 'var(--text-secondary)'}}>Consistent</span></div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>STATUS</div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><CheckCircle size={14} /> Verified</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Claim Extracted</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '1rem', color: 'white' }}>"TAM of $45B by 2030"</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SOURCE</div>
                  <div style={{ fontSize: '0.95rem' }}>Pitch Deck, Slide 9, Market Sizing</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>CROSS-REFERENCE</div>
                  <div style={{ fontSize: '0.95rem' }}>Gartner Report 2024 projects exact niche at $38B — <span style={{color: 'var(--text-secondary)'}}>Slight Discrepancy</span></div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>STATUS</div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><AlertTriangle size={14} /> Flagged</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Claim Extracted</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '1rem', color: 'white' }}>"Founders built previous unicorn"</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SOURCE</div>
                  <div style={{ fontSize: '0.95rem' }}>Founder Updates Email (Feb 12)</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>CROSS-REFERENCE</div>
                  <div style={{ fontSize: '0.95rem' }}>LinkedIn history confirms core team scaled 'TechFusion' from Series A to acquisition — <span style={{color: 'var(--text-secondary)'}}>Confirmed</span></div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>STATUS</div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><CheckCircle size={14} /> Verified</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}

export default SampleAuditDashboard;
