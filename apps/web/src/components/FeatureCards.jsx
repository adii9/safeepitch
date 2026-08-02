import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Bot, Database, Activity, Workflow, Shield, SearchCheck } from 'lucide-react';

const TiltCard = ({ icon: Icon, title, description }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      className="glass-panel mobile-p-4"
    >
      <div style={{ padding: '2.5rem', transform: 'translateZ(30px)', flex: 1 }}>
        <div style={{ 
          width: '50px', height: '50px', 
          borderRadius: '12px', 
          background: 'rgba(139, 92, 246, 0.1)', 
          border: '1px solid rgba(139, 92, 246, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.5rem',
          color: 'var(--accent-purple)'
        }}>
          <Icon size={24} />
        </div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)' }}>{description}</p>
      </div>
    </motion.div>
  );
};

const FeatureCards = () => {
  const features = [
    {
      icon: Activity,
      title: 'Continuous Deal Monitoring',
      description: 'Track every pitch deck, follow-up, and founder update across your entire deal flow — not a one-time snapshot.'
    },
    {
      icon: Database,
      title: 'CRM-Native',
      description: 'Data goes directly to HubSpot, Affinity, or any CRM — not a separate dashboard nobody opens.'
    },
    {
      icon: Bot,
      title: 'AI That Shows Its Work',
      description: 'Every data point is traceable: here\'s what we read, here\'s what we found, here\'s what we couldn\'t verify.'
    },
    {
      icon: Workflow,
      title: 'n8n + Webhook Ready',
      description: 'Trigger workflows on any deal event. Push data to Slack, Notion, or your own internal tools automatically.'
    },
    {
      icon: Shield,
      title: 'Privacy by Default',
      description: 'Your deal data is never stored after processing, never used for training. Full confidentiality by design.'
    },
    {
      icon: SearchCheck,
      title: 'Analyst-Grade Verification',
      description: 'Not just extraction. Cross-references founder claims against LinkedIn, Tracxn, and public data before presenting.'
    }
  ];

  return (
    <section id="features" style={{ padding: '100px 0', position: 'relative' }}>
        <div className="container">
           <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2>Deal Intelligence That Compounds. <br /><span className="text-gradient">Not One-Off Audits.</span></h2>
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', perspective: '1000px' }}>
             {features.map((f, i) => (
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
                 transition={{ duration: 0.6, delay: i * 0.1 }}
                 key={i}
               >
                 <TiltCard {...f} />
               </motion.div>
             ))}
           </div>
        </div>
    </section>
  );
};

export default FeatureCards;
