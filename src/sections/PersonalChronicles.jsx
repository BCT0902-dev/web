import React, { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Briefcase, School, BookOpen, Star, Rocket } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';

const Milestone = ({ milestone, index, isLast, image }) => {
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

  const isEven = index % 2 === 0;

  return (
    <div 
      ref={ref} 
      style={{ 
        position: 'relative', 
        display: 'flex', 
        justifyContent: isEven ? 'flex-start' : 'flex-end',
        paddingBottom: isLast ? 0 : '12rem',
        paddingLeft: isEven ? '0' : '5%',
        paddingRight: isEven ? '5%' : '0'
      }}
    >
      {/* Content Card */}
      <motion.div 
        style={{ 
            width: '45%',
            opacity: useTransform(scrollYProgress, [0, 1], [0, 1]),
            x: useTransform(scrollYProgress, [0, 1], [isEven ? -50 : 50, 0])
        }}
        className="glass-panel"
        style={{ 
          padding: '2.5rem', 
          background: 'var(--bg-glass)', 
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '24px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          zIndex: 5
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <motion.span 
            style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '1.2rem', 
                color: 'var(--accent-main)',
                fontWeight: 'bold'
            }}
            >
            {milestone.year}
            </motion.span>
            <div style={{ color: 'var(--accent-secondary)' }}>{icons[index]}</div>
        </div>

        <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'Chakra Petch', fontSize: '1.4rem', color: '#fff', marginBottom: '1rem' }}>{milestone.title}</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{milestone.desc}</p>
        </div>

        {image && (
            <div style={{ width: '100%', height: '220px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img src={image} alt={milestone.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
        )}
        
        {/* Subtle background icon */}
        <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.03, transform: 'rotate(-15deg)' }}>
            {icons[index] && React.cloneElement(icons[index], { size: 120 })}
        </div>
      </motion.div>

      {/* Connection Node */}
      <div 
        style={{ 
            position: 'absolute', 
            left: '50%', 
            top: '40px', 
            transform: 'translateX(-50%)',
            zIndex: 10 
        }}
      >
        <motion.div 
            style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-main)',
                boxShadow: '0 0 20px var(--accent-main)',
                scale: useTransform(scrollYProgress, [0, 1], [0.5, 1.2])
            }}
        />
      </div>
    </div>
  );
};

const CurvyPath = ({ scrollYProgress }) => {
    const pathLength = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

    // A snake-like path moving down the center
    return (
        <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 100 1000" 
            preserveAspectRatio="none"
            style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                pointerEvents: 'none',
                overflow: 'visible'
            }}
        >
            <path 
                d="M50,0 C70,100 30,200 50,300 C70,400 30,500 50,600 C70,700 30,800 50,900 C70,950 50,1000 50,1100"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="0.5"
            />
            <motion.path 
                d="M50,0 C70,100 30,200 50,300 C70,400 30,500 50,600 C70,700 30,800 50,900 C70,950 50,1000 50,1100"
                fill="none"
                stroke="var(--accent-main)"
                strokeWidth="0.8"
                style={{ pathLength: pathLength }}
                filter="drop-shadow(0 0 8px var(--accent-main))"
            />
        </svg>
    );
};

const PersonalChronicles = () => {
  const { t } = useTranslation();
  const { config } = useConfig();
  const containerRef = useRef(null);
  
  const images = config?.content?.filmStripImages || [];
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
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
    <section 
        id="chronicles" 
        ref={containerRef}
        style={{ 
            position: 'relative', 
            background: 'transparent',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '10rem 2rem'
        }}
    >
      <div 
        style={{ position: 'relative' }}
      >
        {/* Curvy Line Background */}
        <CurvyPath scrollYProgress={scrollYProgress} />

        <div style={{ position: 'relative', zIndex: 2 }}>
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', marginBottom: '8rem' }}
            >
                <h2 className="text-gradient" style={{ fontSize: '3.5rem', fontFamily: 'Chakra Petch' }}>{t('chronicles.title')}</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>{t('chronicles.subtitle')}</p>
            </motion.div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {milestones.map((milestone, idx) => (
                    <Milestone 
                        key={idx} 
                        milestone={milestone} 
                        index={idx} 
                        isLast={idx === milestones.length - 1} 
                        image={images[idx]}
                    />
                ))}
            </div>
        </div>
      </div>
    </section>
  );
};

export default PersonalChronicles;
