import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Bot, FileSpreadsheet, FileText, Database, CalendarClock } from 'lucide-react';

const WorkflowAnimation = () => {
  return (
    <div className="mobile-hidden" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto 4rem auto', position: 'relative', padding: '2rem 1rem' }}>
      
      {/* Underlying Connection Line */}
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '8%', 
        right: '8%', 
        height: '2px', 
        background: 'rgba(255,255,255,0.1)',
        transform: 'translateY(-50%)',
        zIndex: 0
      }} />

      {/* Particle 1: Raw Pitch Deck (Email to AI) */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        animate={{ 
          left: ['8%', '38%', '38%'], 
          opacity: [0, 1, 0] 
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          times: [0, 0.25, 0.3],
          ease: "easeInOut"
        }}
      >
        <div style={{ background: 'var(--accent-blue)', padding: '6px', borderRadius: '8px', display: 'flex', boxShadow: '0 0 15px var(--accent-blue)' }}>
          <FileText size={14} color="white" />
        </div>
      </motion.div>

      {/* Particle 2: Structured Data (AI to CRM) */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
        animate={{ 
          left: ['38%', '38%', '68%'], 
          opacity: [0, 0, 1, 0] 
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          times: [0, 0.35, 0.4, 0.6],
          ease: "easeInOut"
        }}
      >
        <div style={{ background: 'var(--accent-green)', width: '6px', height: '6px', borderRadius: '50%', boxShadow: '0 0 10px var(--accent-green)' }} />
        <div style={{ background: 'var(--accent-green)', width: '6px', height: '6px', borderRadius: '50%', boxShadow: '0 0 10px var(--accent-green)' }} />
        <div style={{ background: 'var(--accent-green)', width: '6px', height: '6px', borderRadius: '50%', boxShadow: '0 0 10px var(--accent-green)' }} />
      </motion.div>

      {/* Particle 3: Triggers (CRM to Scheduling) */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
        animate={{ 
          left: ['68%', '68%', '92%'], 
          opacity: [0, 0, 1, 0] 
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          times: [0, 0.65, 0.7, 0.95],
          ease: "easeInOut"
        }}
      >
        <div style={{ background: '#eab308', width: '12px', height: '12px', borderRadius: '50%', boxShadow: '0 0 10px #eab308' }} />
      </motion.div>

      {/* The 4 Nodes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        
        {/* Node 1: Email */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100px' }}>
          <motion.div 
            style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', border: '2px solid rgba(59, 130, 246, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            animate={{ boxShadow: ['0 0 0px rgba(59, 130, 246, 0)', '0 0 30px rgba(59, 130, 246, 0.6)', '0 0 0px rgba(59, 130, 246, 0)'] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.3] }}
          >
            <Mail size={30} color="var(--accent-blue)" />
          </motion.div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Founder Email<br/>with Deck</div>
        </div>

        {/* Node 2: AI Processor */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100px' }}>
          <motion.div 
            style={{ width: '90px', height: '90px', borderRadius: '24px', background: 'rgba(139, 92, 246, 0.15)', border: '2px solid rgba(139, 92, 246, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
            animate={{ boxShadow: ['0 0 0px rgba(139, 92, 246, 0)', '0 0 40px rgba(139, 92, 246, 0.8)', '0 0 0px rgba(139, 92, 246, 0)'] }}
            transition={{ duration: 4, repeat: Infinity, times: [0.2, 0.35, 0.5] }}
          >
            <Bot size={40} color="var(--accent-purple)" />
          </motion.div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-purple)', textAlign: 'center' }}>Specialized AI<br/>Agents</div>
        </div>

        {/* Node 3: Spreadsheet/CRM */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100px' }}>
          <motion.div 
            style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            animate={{ boxShadow: ['0 0 0px rgba(16, 185, 129, 0)', '0 0 0px rgba(16, 185, 129, 0)', '0 0 30px rgba(16, 185, 129, 0.6)'] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.55, 0.7] }}
          >
            <Database size={30} color="var(--accent-green)" />
          </motion.div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', whiteSpace: 'nowrap' }}>Structured CRM<br/>& Sheets</div>
        </div>

        {/* Node 4: Meeting Scheduling */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100px' }}>
          <motion.div 
            style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)', border: '2px solid rgba(234, 179, 8, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            animate={{ boxShadow: ['0 0 0px rgba(234, 179, 8, 0)', '0 0 0px rgba(234, 179, 8, 0)', '0 0 30px rgba(234, 179, 8, 0.6)'] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 1] }}
          >
            <CalendarClock size={30} color="#eab308" />
          </motion.div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', whiteSpace: 'nowrap' }}>Meeting<br/>Scheduling</div>
        </div>

      </div>
    </div>
  );
};

export default WorkflowAnimation;
