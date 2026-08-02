import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { motion } from 'framer-motion';

// Random points generator for a subtle tech environment
const generateRandomPoints = (count, radius) => {
  const points = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * radius;
    const y = (Math.random() - 0.5) * radius;
    const z = (Math.random() - 0.5) * radius;
    points[i * 3] = x;
    points[i * 3 + 1] = y;
    points[i * 3 + 2] = z;
  }
  return points;
};

const BackgroundParticles = () => {
  const pointsRef = useRef();
  const points = useMemo(() => generateRandomPoints(500, 20), []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.05;
      pointsRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <Points ref={pointsRef} positions={points} frustumCulled={false}>
      <PointMaterial transparent color="#3b82f6" size={0.05} sizeAttenuation={true} depthWrite={false} opacity={0.6} />
    </Points>
  );
};

const DensePitchDeckSlide = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
      transition={{ opacity: { duration: 0.5 }, scale: { duration: 0.5 }, y: { repeat: Infinity, duration: 6, ease: "easeInOut" } }}
      style={{
        width: '900px',
        maxWidth: '100%',
        boxSizing: 'border-box',
        background: 'var(--bg-secondary)',
        backgroundImage: 'url(/quantum-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: '1px solid rgba(139, 92, 246, 0.5)',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(139, 92, 246, 0.15)',
        padding: 'clamp(1.5rem, 5vw, 3.5rem)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(15,18,24,0.7) 0%, rgba(15,18,24,0.98) 100%)', zIndex: 0 }} />

      <div className="audit-board-title" style={{ position: 'relative', zIndex: 1, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', margin: '0 0 0.2rem 0', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            NEXUS QUANTUM
          </h1>
          <div style={{ color: '#06b6d4', fontSize: 'clamp(0.7rem, 1.2vw, 0.9rem)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>
            Traction & Financial Projections
          </div>
        </div>
        <div className="audit-board-time-block">
           <div style={{ padding: '0.4rem 0.8rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#ef4444', fontWeight: 600, fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)', display: 'inline-block', marginBottom: '0.5rem', whiteSpace: 'nowrap' }}>
             STRICTLY CONFIDENTIAL
           </div>
           <div style={{ color: '#9ba1a6', fontSize: '0.7rem' }}>Slide 12 / 24</div>
        </div>
      </div>

      <div className="responsive-grid" style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* Dense Text Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', color: '#f0f2f5', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <span style={{ display: 'inline-block', width: '4px', height: '14px', background: '#3b82f6', borderRadius: '2px' }}></span> Q3 Performance Metrics
            </h3>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#9ba1a6', fontSize: '0.85rem', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>Achieved <strong style={{color:'white'}}>18ms coherence time</strong> at ambient temp.</li>
              <li>Secured 3 pilot contracts with logistics firms.</li>
              <li>Successfully miniaturized Q-Core form factor.</li>
              <li>Filed 4 patents blocking bypass techniques.</li>
            </ul>
          </div>
          
          <div>
            <h3 style={{ fontSize: '1rem', color: '#f0f2f5', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <span style={{ display: 'inline-block', width: '4px', height: '14px', background: '#8b5cf6', borderRadius: '2px' }}></span> Go-To-Market Strategy
            </h3>
            <p style={{ color: '#9ba1a6', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
              Deploying via cloud-API structure starting Q4 prior to direct hardware sales. Partnerships negotiated with AWS Braket. Over <strong style={{color:'white'}}>14,000 developers</strong> waitlisted.
            </p>
          </div>
        </div>

        {/* Dense Data Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
             <div className="audit-card-grid">
                <div>
                  <div style={{ color: '#06b6d4', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Current ARR</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>$1.2M</div>
                </div>
                <div>
                  <div style={{ color: '#06b6d4', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Proj. 2028 ARR</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>$84M</div>
                </div>
                <div>
                  <div style={{ color: '#9ba1a6', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>EBITDA Margin</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>-42%</div>
                </div>
                <div>
                  <div style={{ color: '#9ba1a6', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Burn Rate</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#ef4444' }}>$450k/mo</div>
                </div>
             </div>
           </div>

           {/* Fake Chart Area */}
           <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
             <div style={{ fontSize: '0.7rem', color: '#9ba1a6', marginBottom: '0.5rem' }}>Projected Revenue Growth (Millions)</div>
             <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px', paddingTop: '10px' }}>
                {[1.2, 4.5, 12, 28, 55, 84].map((val, i) => (
                  <div key={i} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ fontSize: '0.6rem', color: 'white' }}>${val}</div>
                    <div style={{ width: '100%', height: `${(val/84)*100}%`, minHeight: '5px', background: i === 5 ? 'var(--accent-cyan)' : 'var(--accent-purple)', borderRadius: '3px 3px 0 0', opacity: 0.8 }} />
                    <div style={{ fontSize: '0.6rem', color: '#9ba1a6' }}>'2{i+3}</div>
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>
      
    </motion.div>
  );
};

const ThreeDPDFAudit = ({ onAnalyze }) => {
  return (
    <div style={{ width: '100%', minHeight: '100vh', position: 'relative', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
      
      {/* 3D Background - decoupled from UI size constraints */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <BackgroundParticles />
        </Canvas>
      </div>

      {/* Main Responsive UI Container */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1200px', padding: '6rem 1rem 3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', margin: 'auto 0' }}>
        
        <DensePitchDeckSlide />

        {/* Floating Action Button */}
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.8rem',
            background: 'rgba(8, 10, 14, 0.85)',
            padding: 'clamp(1rem, 3vw, 1.2rem) clamp(1rem, 5vw, 2.5rem)',
            borderRadius: '20px',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(139, 92, 246, 0.1)'
        }}>
          <div style={{ 
            color: 'var(--accent-cyan)', 
            letterSpacing: '0.15em', 
            fontSize: '0.75rem', 
            textTransform: 'uppercase', 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600
          }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)', boxShadow: '0 0 10px var(--accent-cyan)' }}></span>
            Pitch Deck Ready for Analysis
          </div>
          <button 
             className="btn btn-primary pulse-glowing" 
             onClick={onAnalyze}
             style={{ padding: 'clamp(0.7rem, 2vw, 0.9rem) clamp(1rem, 4vw, 2.2rem)', minHeight: '44px', fontSize: 'clamp(0.85rem, 3vw, 1.05rem)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
             Extract Data via SafeDeck AI
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreeDPDFAudit;
