import React, { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Briefcase, School, BookOpen, Star, Rocket } from 'lucide-react';

const Milestone = ({ milestone, index, isLast }) => {
  const { t } = useTranslation();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"]
  });

  const icons = [
    <School size={24} />,
    <School size={24} />,
    <School size={24} />,
    <GraduationCap size={24} />,
    <Star size={24} />,
    <Briefcase size={24} />
  ];

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', gap: '3rem', paddingBottom: isLast ? 0 : '10rem' }}>
      {/* Date Marker (Left) */}
      <div style={{ width: '120px', textAlign: 'right', flexShrink: 0, paddingTop: '10px' }}>
        <motion.span 
          style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '1.2rem', 
            color: 'var(--accent-main)',
            opacity: useTransform(scrollYProgress, [0, 1], [0.3, 1])
          }}
        >
          {milestone.year}
        </motion.span>
      </div>

      {/* Center Line & Node */}
      <div style={{ position: 'relative', width: '40px', display: 'flex', justifyContent: 'center' }}>
        <motion.div 
            style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-main)',
                boxShadow: '0 0 15px var(--accent-main)',
                zIndex: 2,
                marginTop: '15px',
                scale: useTransform(scrollYProgress, [0, 1], [0.5, 1.2])
            }}
        />
      </div>

      {/* Content (Right) */}
      <motion.div 
        style={{ 
            flex: 1,
            opacity: useTransform(scrollYProgress, [0, 1], [0, 1]),
            x: useTransform(scrollYProgress, [0, 1], [50, 0])
        }}
        className="glass-panel"
        style={{ 
          padding: '2rem', 
          background: 'var(--bg-glass)', 
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
           <div style={{ color: 'var(--accent-secondary)' }}>{icons[index]}</div>
           <h3 style={{ fontFamily: 'Chakra Petch', fontSize: '1.4rem', color: '#fff' }}>{milestone.title}</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{milestone.desc}</p>
        
        {/* Subtle background icon */}
        <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.03, transform: 'rotate(-15deg)' }}>
            {icons[index] && React.cloneElement(icons[index], { size: 120 })}
        </div>
      </motion.div>
    </div>
  );
};

const PersonalChronicles = () => {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const milestones = [];
  for(let i=1; i<=6; i++) {
    milestones.push({
      year: t(`chronicles.m${i}.year`),
      title: t(`chronicles.m${i}.title`),
      desc: t(`chronicles.m${i}.desc`)
    });
  }

  return (
    <section id="chronicles" ref={containerRef} style={{ padding: '10rem 2rem', background: 'transparent', position: 'relative' }}>
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ textAlign: 'center', marginBottom: '8rem' }}>
                <h2 className="text-gradient" style={{ fontSize: '3.5rem', fontFamily: 'Chakra Petch' }}>{t('chronicles.title')}</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>{t('chronicles.subtitle')}</p>
            </header>

            <div style={{ position: 'relative' }}>
                {/* Vertical Progress Line */}
                <div style={{ 
                    position: 'absolute', 
                    top: '20px', 
                    left: '169px', // 120 (date) + 3/2*40 (center space) - adjusted
                    width: '2px', 
                    height: 'calc(100% - 20px)', 
                    background: 'rgba(255,255,255,0.05)',
                    zIndex: 0
                }} />
                
                <motion.div style={{ 
                    position: 'absolute', 
                    top: '20px', 
                    left: '169px', 
                    width: '2px', 
                    height: 'calc(100% - 20px)', 
                    background: 'linear-gradient(to bottom, var(--accent-main), var(--accent-secondary))',
                    scaleY,
                    originY: 0,
                    boxShadow: '0 0 10px var(--accent-main)',
                    zIndex: 1
                }} />

                {milestones.map((milestone, idx) => (
                    <Milestone 
                        key={idx} 
                        milestone={milestone} 
                        index={idx} 
                        isLast={idx === milestones.length - 1} 
                    />
                ))}
            </div>
        </div>
    </section>
  );
};

export default PersonalChronicles;
