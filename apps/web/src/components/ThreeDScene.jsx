import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Points, PointMaterial, Environment, Sphere } from '@react-three/drei';

// Random points generator for the background
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

// Background Particle Network
const ParticleNetwork = () => {
  const pointsRef = useRef();
  const points = useMemo(() => generateRandomPoints(1000, 15), []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.05;
      pointsRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <Points ref={pointsRef} positions={points} frustumCulled={false}>
      <PointMaterial transparent color="#06b6d4" size={0.05} sizeAttenuation={true} depthWrite={false} />
    </Points>
  );
};

// "Messy Decks" turning into "Data Modules"
const ProcessingStream = () => {
  const groupRef = useRef();
  
  // 15 boxes representing standard "Messy PDFs/Emails"
  const incoming = useMemo(() => Array.from({ length: 15 }), []);
  
  // 45 tiny dots representing structured "CRM/Excel Data"
  const outgoing = useMemo(() => Array.from({ length: 45 }), []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(time * 0.5) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central AI Processor Core */}
      <Float speed={3} rotationIntensity={1} floatIntensity={1}>
        <Sphere args={[1.2, 64, 64]}>
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.6} roughness={0.1} metalness={0.9} wireframe={true} />
        </Sphere>
        <Sphere args={[1.0, 32, 32]}>
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={1} />
        </Sphere>
      </Float>

      {/* Incoming Stream: Emails / Messy Decks */}
      {incoming.map((_, i) => (
        <IncomingNode key={`in-${i}`} index={i} />
      ))}

      {/* Outgoing Stream: Structured Spreadsheet/CRM Nodes */}
      {outgoing.map((_, i) => (
        <OutgoingNode key={`out-${i}`} index={i} />
      ))}
    </group>
  );
};

const IncomingNode = ({ index }) => {
  const meshRef = useRef();
  
  const speed = useMemo(() => 1 + Math.random() * 2, []);
  const offset = useMemo(() => Math.random() * 10, []);
  const startY = useMemo(() => (Math.random() - 0.5) * 4, []);
  const startZ = useMemo(() => (Math.random() - 0.5) * 4, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Animate from Left (-8) towards Center (0)
    let currentX = -8 + ((time * speed + offset) % 8);
    meshRef.current.position.set(currentX, startY * Math.max(0.1, Math.abs(currentX)/8), startZ * Math.max(0.1, Math.abs(currentX)/8));
    
    // Tumble randomly
    meshRef.current.rotation.x += delta * 3;
    meshRef.current.rotation.y += delta * 2;

    // Fade out / shrink as it gets near the core
    const scale = Math.max(0.01, Math.abs(currentX) / 8);
    meshRef.current.scale.set(scale * 0.6, scale * 0.8, scale * 0.1);
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ef4444" roughness={0.4} />
    </mesh>
  );
};

const OutgoingNode = ({ index }) => {
  const meshRef = useRef();
  
  const speed = useMemo(() => 2 + Math.random() * 3, []);
  const offset = useMemo(() => Math.random() * 10, []);
  const startY = useMemo(() => (Math.random() - 0.5) * 3, []);
  const startZ = useMemo(() => (Math.random() - 0.5) * 3, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Animate from Center (0) towards Right (8)
    let currentX = ((time * speed + offset) % 8);
    
    // Move in a structured straight line grid-like fashion
    meshRef.current.position.set(currentX, startY * (currentX/4), startZ * (currentX/4));
    
    // Clean, ordered rotation
    meshRef.current.rotation.set(0, currentX * 0.2, 0);

    // Fade in / scale up as it leaves the core
    const scale = Math.min(1, currentX / 2);
    meshRef.current.scale.set(scale * 0.3, scale * 0.3, scale * 0.3);
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.8} />
    </mesh>
  );
};

const ThreeDScene = () => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 9], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, 0, -5]} color="#8b5cf6" intensity={4} />
        <spotLight position={[10, 0, 5]} color="#06b6d4" intensity={4} />
        <ParticleNetwork />
        <ProcessingStream />
        <Environment preset="city" />
      </Canvas>
      <div style={{
          position: 'absolute',
          bottom: '20px',
          width: '100%',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.8rem',
          letterSpacing: '0.05em',
          pointerEvents: 'none'
      }}>
        [ LIVE AI PROCESSING STREAM ]
      </div>
    </div>
  );
};

export default ThreeDScene;
