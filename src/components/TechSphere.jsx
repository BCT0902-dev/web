import React from 'react';
import { motion } from 'framer-motion';

const DataPanel = ({ width, height, rotateZ, delay, color }) => (
  <motion.div
    initial={{ rotateZ }}
    animate={{ rotateZ: rotateZ + 360 }}
    transition={{ duration: 15, repeat: Infinity, ease: "linear", delay }}
    style={{
      position: 'absolute',
      width: width,
      height: height,
      border: `1px solid ${color}`,
      background: `${color}11`,
      backdropFilter: 'blur(2px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      padding: '4px',
      opacity: 0.4
    }}
  >
    <div style={{ width: '100%', height: '2px', background: color }} />
    <div style={{ width: '60%', height: '1px', background: color, opacity: 0.5 }} />
    <div style={{ width: '80%', height: '1px', background: color, opacity: 0.5 }} />
  </motion.div>
);

const OrbShell = ({ size, color, rotateX, rotateY, duration, dash }) => (
  <motion.div
    animate={{ rotateX: rotateX + 360, rotateY: rotateY + 360 }}
    transition={{ duration, repeat: Infinity, ease: "linear" }}
    style={{
      position: 'absolute',
      width: size,
      height: size,
      border: `1px ${dash ? 'dashed' : 'solid'} ${color}`,
      borderRadius: '50%',
      opacity: 0.2
    }}
  />
);

const TechSphere = () => {
  return (
    <div style={{
      position: 'absolute',
      right: '2%',
      top: '10%',
      width: '600px',
      height: '600px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      perspective: '1500px',
      zIndex: -1,
      pointerEvents: 'none'
    }}>
      {/* Intense Background Glow */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
        filter: 'blur(100px)',
        opacity: 0.4
      }} />

      {/* Outer Shells (Lat/Long) */}
      <OrbShell size="550px" color="var(--accent-main)" rotateX={0} rotateY={0} duration={40} dash />
      <OrbShell size="500px" color="var(--accent-gold)" rotateX={45} rotateY={45} duration={30} />
      <OrbShell size="450px" color="var(--accent-main)" rotateX={90} rotateY={0} duration={25} />

      {/* Floating Data Panels (The rectangles in the image) */}
      <div style={{ position: 'absolute', width: '400px', height: '400px', transformStyle: 'preserve-3d' }}>
         <DataPanel width="40px" height="60px" rotateZ={0} delay={0} color="var(--accent-main)" />
         <DataPanel width="60px" height="30px" rotateZ={90} delay={2} color="var(--accent-gold)" />
         <DataPanel width="50px" height="50px" rotateZ={180} delay={4} color="var(--accent-main)" />
         <DataPanel width="30px" height="80px" rotateZ={270} delay={6} color="var(--accent-gold)" />
      </div>

      {/* Rotating Ring Groups */}
      <motion.div
        animate={{ rotateX: 360, rotateZ: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          width: '350px',
          height: '350px',
          border: '4px double var(--accent-main)',
          borderRadius: '50%',
          opacity: 0.3,
          boxShadow: '0 0 30px var(--accent-glow)'
        }}
      />

      {/* Golden Accents Rings */}
      <motion.div
        animate={{ rotateY: -360, rotateZ: 180 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          border: '2px solid var(--accent-gold)',
          borderRadius: '50%',
          opacity: 0.2,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent'
        }}
      />

      {/* The Core */}
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: '180px',
          height: '180px',
          background: 'radial-gradient(circle, #fff 0%, var(--accent-main) 30%, transparent 70%)',
          borderRadius: '50%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: 0.6,
          boxShadow: '0 0 60px var(--accent-main)'
        }}
      >
         {/* Inner Grid Pattern */}
         <svg width="100" height="100" viewBox="0 0 100 100" opacity="0.8">
            <path d="M10 50 H90 M50 10 V90" stroke="white" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2,2" />
            <rect x="40" y="40" width="20" height="20" fill="white" opacity="0.2" />
         </svg>
      </motion.div>

      {/* Network Nodes (Particles) */}
      {Array.from({ length: 30 }).map((_, i) => {
        const angle = (i / 30) * Math.PI * 2;
        const radius = 220 + Math.random() * 40;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <motion.div
            key={i}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{ 
              duration: 2 + Math.random() * 3, 
              repeat: Infinity, 
              delay: Math.random() * 5 
            }}
            style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              background: i % 3 === 0 ? 'var(--accent-gold)' : 'var(--accent-main)',
              borderRadius: '50%',
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              boxShadow: `0 0 10px ${i % 3 === 0 ? 'var(--accent-gold)' : 'var(--accent-main)'}`,
            }}
          />
        );
      })}

      {/* Floating UI Circles */}
      <motion.div
        animate={{ rotateZ: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        style={{ position: 'absolute', width: '580px', height: '580px', opacity: 0.1 }}
      >
         <div style={{ position: 'absolute', top: 0, left: '50%', width: '100px', height: '1px', background: 'var(--accent-main)' }} />
         <div style={{ position: 'absolute', bottom: 0, left: '50%', width: '100px', height: '1px', background: 'var(--accent-gold)' }} />
      </motion.div>
    </div>
  );
};

export default TechSphere;
