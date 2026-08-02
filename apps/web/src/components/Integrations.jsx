import React from 'react';
import { motion } from 'framer-motion';
import { Database, Layout, Command, Share2, Workflow, MessageSquare } from 'lucide-react';

const IntegrationCard = ({ icon: Icon, name, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="glass-panel mobile-p-4"
    style={{
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      alignItems: 'center',
      textAlign: 'center',
      border: '1px solid rgba(139, 92, 246, 0.1)'
    }}
  >
    <div style={{
      width: '60px',
      height: '60px',
      borderRadius: '16px',
      background: 'rgba(139, 92, 246, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--accent-purple)'
    }}>
      <Icon size={32} />
    </div>
    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{name}</h3>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{description}</p>
  </motion.div>
);

const Integrations = () => {
  const integrations = [
    { name: 'HubSpot', description: 'Deal profiles auto-created from every inbound deck', icon: Database },
    { name: 'Affinity', description: 'Seamlessly map founders and investors to lists', icon: Layout },
    { name: 'Google Sheets', description: 'Real-time database of all extracted pitch data', icon: Command },
    { name: 'Notion', description: 'Auto-generate comprehensive deal memos in workspaces', icon: Share2 },
    { name: 'n8n', description: 'Trigger complex internal workflows instantly', icon: Workflow },
    { name: 'Slack', description: 'Alert teams immediately on high-priority deal flow', icon: MessageSquare }
  ];

  return (
    <section id="integrations" style={{ padding: '100px 0', position: 'relative' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2>Plugs Into Your Stack. <br /><span className="text-gradient">Doesn't Add To It.</span></h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '1rem auto 0 auto', fontSize: '1.1rem' }}>
            SafeDeck lives where you already work.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '2rem' 
        }}>
          {integrations.map((integration, idx) => (
            <IntegrationCard 
              key={idx} 
              {...integration} 
              delay={idx * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Integrations;
