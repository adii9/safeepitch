import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, CheckCircle2, Database, Layout, Command, Share2, Workflow, MessageSquare } from 'lucide-react';
import WorkflowAnimation from './WorkflowAnimation';

const ProblemSolution = () => {
  const comparisons = [
    {
      without: 'Analysts spend 60%+ of time on manual data entry',
      with: 'Structured data arrives automatically'
    },
    {
      without: 'Deal notes live in email threads nobody reads',
      with: 'Every interaction feeds a living deal profile'
    },
    {
      without: 'Competitive intel is out of date the moment you gather it',
      with: 'Real-time signal from every deck and update'
    },
    {
      without: 'Syncing to HubSpot/Affinity is a manual task',
      with: 'Data flows in without touching your keyboard'
    },
    {
      without: 'Thesis fit is a gut call',
      with: 'AI flags thesis alignment from the first deck'
    }
  ];

  const integrations = [
    { name: 'HubSpot', icon: <Database size={20} /> },
    { name: 'Affinity', icon: <Layout size={20} /> },
    { name: 'Google Sheets', icon: <Command size={20} /> },
    { name: 'Notion', icon: <Share2 size={20} /> },
    { name: 'n8n', icon: <Workflow size={20} /> },
    { name: 'Slack', icon: <MessageSquare size={20} /> },
  ];

  return (
    <section id="workflow" style={{ padding: '100px 0', background: 'var(--bg-secondary)', position: 'relative' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
           <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '1rem' }}>
             Not Another Tool. <span className="text-gradient">A Deal Intelligence Layer.</span>
           </h2>
           <p style={{ color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.6 }}>
             Most funds have data. They don't have structured, usable deal intelligence. SafeDeck tracks your entire deal flow—it reads every deck, cross-references every claim, and delivers verified insights directly into the platforms you already use.
           </p>
        </div>

        <WorkflowAnimation />

        <div style={{ 
          marginTop: '4rem',
          display: 'grid', 
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', 
          gap: '2rem',
          background: 'rgba(8, 10, 14, 0.4)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          padding: '2.5rem',
          backdropFilter: 'blur(10px)'
        }} className="responsive-grid mobile-p-4">
          
          <div>
            <h3 style={{ color: 'var(--accent-red)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.3rem' }}>
              <XCircle size={24} /> What Funds Lose Without SafeDeck
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {comparisons.map((item, idx) => (
                <div key={idx} style={{ 
                  padding: '1.2rem', 
                  background: 'rgba(239, 68, 68, 0.05)', 
                  border: '1px solid rgba(239, 68, 68, 0.1)', 
                  borderRadius: '12px',
                  color: 'var(--text-secondary)'
                }}>
                  {item.without}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ color: 'var(--accent-green)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.3rem' }}>
              <CheckCircle2 size={24} /> What SafeDeck Delivers
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {comparisons.map((item, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  key={idx} 
                  style={{ 
                    padding: '1.2rem', 
                    background: 'rgba(16, 185, 129, 0.05)', 
                    border: '1px solid rgba(16, 185, 129, 0.2)', 
                    borderRadius: '12px',
                    color: 'white',
                    fontWeight: '500'
                  }}
                >
                  {item.with}
                </motion.div>
              ))}
            </div>
          </div>

        </div>

        {/* Integrations Strip */}
        <div style={{ marginTop: '4rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: '500' }}>
            Integrates with the tools your fund already runs on.
          </p>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'center', 
            gap: '1rem' 
          }}>
            {integrations.map((integration, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.2rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '30px',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>{integration.icon}</span>
                {integration.name}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default ProblemSolution;
