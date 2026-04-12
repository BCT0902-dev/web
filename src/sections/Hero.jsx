import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TechSphere from '../components/TechSphere';
import QuoteCarousel from '../components/QuoteCarousel';
import { MessageSquare, Globe, Facebook, Github, Youtube, Linkedin, Twitter, Instagram } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';

const RandomCounter = () => {
  const [count, setCount] = useState("10.977.000");

  useEffect(() => {
    const interval = setInterval(() => {
      // Create a more dynamic "jumping" effect by randomizing the last few digits
      const base = 10977000;
      const randomOffset = Math.floor(Math.random() * 999);
      const finalNum = base + randomOffset;
      setCount(finalNum.toLocaleString('de-DE'));
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return <span>{count}+</span>;
};

const Hero = () => {
  const { config } = useConfig();
  
  // Icon mapper function
  const renderIcon = (iconName) => {
    const props = { size: 20 };
    switch (iconName) {
      case 'Facebook': return <Facebook {...props} />;
      case 'Github': return <Github {...props} />;
      case 'LinkedIn': return <Linkedin {...props} />;
      case 'Youtube': return <Youtube {...props} />;
      case 'MessageSquare': return <MessageSquare {...props} />;
      case 'Instagram': return <Instagram {...props} />;
      case 'Twitter': return <Twitter {...props} />;
      default: return <Globe {...props} />;
    }
  };

  // Fallback defaults if not yet configured
  const defaultSocials = [
    { name: "Facebook", color: "#1877F2", icon: "Facebook", url: "#", isVisible: true },
    { name: "Github", color: "#2ea44f", icon: "Github", url: "#", isVisible: true },
    { name: "LinkedIn", color: "#0A66C2", icon: "LinkedIn", url: "#", isVisible: true },
    { name: "Youtube", color: "#FF0000", icon: "Youtube", url: "#", isVisible: true },
    { name: "Messenger", color: "#0084FF", icon: "MessageSquare", url: "#", isVisible: true }
  ];

  const activeSocials = (config?.social_links || defaultSocials).filter(s => s.isVisible !== false);

  return (
    <section id="home" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'relative',
      paddingTop: '2rem'
    }} className="container">
      
      <div style={{ maxWidth: '1000px', zIndex: 10 }}>
        <motion.p 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)', marginBottom: '1.5rem', letterSpacing: '2px' }}
        >
          XIN CHÀO _ // ĐÂY LÀ
        </motion.p>
        
        <motion.h1 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          style={{ 
            fontSize: 'clamp(3rem, 8vw, 6rem)', 
            marginBottom: '1rem',
            fontFamily: "'Chakra Petch', sans-serif"
          }}
          className="text-gradient"
        >
          Bùi Công Tới
        </motion.h1>

        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          style={{ 
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', 
            color: 'var(--text-secondary)', 
            marginBottom: '2rem',
            fontFamily: "'Chakra Petch', sans-serif",
            fontWeight: 400
          }}
        >
          Người Việt Nam yêu thích công nghệ
        </motion.h2>

        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 1, delay: 0.8 }}
        >
          <QuoteCarousel />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          style={{ display: 'flex', gap: '1.5rem', marginTop: '3rem' }}
        >
          <a href="#projects" className="btn-primary">
            XEM DỰ ÁN
          </a>
          <motion.a 
            href="#contact" 
            className="btn-secondary"
            animate={{ 
              boxShadow: [
                '0 0 0px var(--accent-secondary)', 
                '0 0 20px var(--accent-secondary)', 
                '0 0 0px var(--accent-secondary)'
              ]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            style={{
              border: '2px solid var(--accent-secondary)',
              color: 'var(--accent-secondary)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            LIÊN HỆ NGAY
          </motion.a>
        </motion.div>
        
        {/* Unified Tech Toolbar (Socials & Likes) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2rem', marginTop: '4rem', width: '100%' }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}
          >
            {activeSocials.map((social, idx) => (
              <a 
                key={idx} 
                href={social.url || "#"} 
                target="_blank"
                rel="noreferrer"
                className="glass-panel" 
                style={{ 
                  padding: '0.6rem 1rem', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.3s ease' 
                }}
                onMouseOver={(e) => {
                  const icon = e.currentTarget.querySelector('svg');
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.borderColor = social.color || '#fff';
                  e.currentTarget.style.boxShadow = `0 10px 20px -10px ${social.color || '#fff'}55`;
                  e.currentTarget.style.background = `${social.color || '#fff'}11`;
                  if (icon) icon.style.color = social.color || '#fff';
                  e.currentTarget.querySelector('span').style.color = social.color || '#fff';
                }}
                onMouseOut={(e) => {
                  const icon = e.currentTarget.querySelector('svg');
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--bg-glass-border)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = 'var(--bg-glass)';
                  if (icon) icon.style.color = 'inherit';
                  e.currentTarget.querySelector('span').style.color = 'var(--text-muted)';
                }}
              >
                {renderIcon(social.icon)}
                <span style={{ 
                  fontSize: '0.65rem', 
                  fontWeight: 600, 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px',
                  color: 'var(--text-muted)',
                  transition: 'color 0.3s'
                }}>
                  {social.name}
                </span>
              </a>
            ))}
          </motion.div>

          {/* Likes Counter - Perfectly Aligned Horizontally */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              fontFamily: '"Share Tech Mono", monospace',
              padding: '0.5rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid var(--bg-glass-border)',
              background: 'var(--bg-glass)',
              height: '74px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 400, color: 'var(--accent-main)', minWidth: '140px' }}>
                <RandomCounter />
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                total likes
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <motion.span 
                animate={{ scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }} 
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ fontSize: '1.4rem', cursor: 'default' }}
                title="Love"
              >
                ❤️
              </motion.span>
              <motion.span 
                animate={{ y: [0, -8, 0], scale: [1, 1.2, 1] }} 
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                style={{ fontSize: '1.4rem', cursor: 'default' }}
                title="Like"
              >
                👍
              </motion.span>
            </div>
          </motion.div>
        </div>
      </div>

      <TechSphere />
    </section>
  );
};

export default Hero;
