import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles, Cpu, Globe, Rocket } from 'lucide-react';

const milestones = [
  {
    year: "2020",
    title: "INITIATION",
    desc: "First lines of logic written. The discovery of a lifelong passion for building digital worlds.",
    icon: <Cpu size={24} />,
    color: "var(--accent-secondary)"
  },
  {
    year: "2022",
    title: "WEB ARCHITECTURE",
    desc: "Mastering the foundations of the modern web. Expanding the vision into complex ecosystem design.",
    icon: <Globe size={24} />,
    color: "var(--accent-main)"
  },
  {
    year: "2024",
    title: "AI CONVERGENCE",
    desc: "The integration of neural protocols. Transforming static systems into dynamic, intelligent entities.",
    icon: <Sparkles size={24} />,
    color: "#673AB7"
  },
  {
    year: "2026",
    title: "IRIS RENAISSANCE",
    desc: "The birth of the complete IRIS AI Ecosystem. A new era of creative technical harmony.",
    icon: <Rocket size={24} />,
    color: "var(--success)"
  }
];

const HistoryTimeline = () => {
  const { t } = useTranslation();
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  // Create horizontal movement based on vertical scroll
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);

  return (
    <section 
      ref={targetRef} 
      id="history" 
      style={{ 
        height: '300vh', 
        position: 'relative', 
        background: 'var(--bg-primary)',
        marginTop: '-5rem' 
      }}
    >
      <div style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '15vh',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          zIndex: 10
        }}>
          <h2 style={{ 
            fontFamily: 'Chakra Petch', 
            fontSize: 'var(--section-title-size, 3rem)',
            color: 'var(--accent-main)',
            marginBottom: '1rem'
          }}>
            {t('sections.timeline_title', '< Iris_Chronicles />')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
            {t('sections.timeline_subtitle', 'Sơ đồ tiến hóa của một thực thể kỹ thuật số.')}
          </p>
        </div>

        <motion.div style={{ x, display: 'flex', gap: '20vw', padding: '0 10vw', alignItems: 'center' }}>
          {milestones.map((item, index) => (
            <div key={index} style={{ position: 'relative', flexShrink: 0 }}>
              {/* Connection Line */}
              {index !== milestones.length - 1 && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '100%',
                  width: '20vw',
                  height: '2px',
                  background: `linear-gradient(to right, ${item.color}, ${milestones[index+1].color})`,
                  opacity: 0.3,
                  zIndex: -1
                }} />
              )}

              {/* Year Marker */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="glass-panel"
                style={{
                  width: '350px',
                  padding: '2.5rem',
                  borderRadius: '24px',
                  border: `1px solid ${item.color}33`,
                  position: 'relative',
                  backgroundColor: 'rgba(10, 10, 15, 0.8)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: `0 20px 50px -10px ${item.color}22`
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-40px',
                  left: '20px',
                  fontSize: '4rem',
                  fontWeight: 900,
                  fontFamily: 'Chakra Petch',
                  opacity: 0.1,
                  color: item.color,
                  zIndex: -1
                }}>
                  {item.year}
                </div>

                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  backgroundColor: `${item.color}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.color,
                  marginBottom: '1.5rem',
                  border: `1px solid ${item.color}44`
                }}>
                  {item.icon}
                </div>

                <h3 style={{ 
                  fontSize: '1.5rem', 
                  marginBottom: '1rem', 
                  fontFamily: 'Chakra Petch',
                  color: '#fff'
                }}>
                  {item.title}
                </h3>
                
                <p style={{ 
                  color: 'var(--text-secondary)', 
                  lineHeight: '1.7',
                  fontSize: '1rem' 
                }}>
                  {item.desc}
                </p>

                {/* Pulsing Node */}
                <div style={{
                  position: 'absolute',
                  right: '-10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: item.color,
                  boxShadow: `0 0 20px ${item.color}`
                }}>
                  <motion.div 
                    animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </motion.div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HistoryTimeline;
