import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { Moon, Sun, Globe, User, Bot, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

const Navbar = () => {
  const { config } = useConfig();
  const logoUrl = config?.appearance?.logoUrl || '/logobct.png';
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  const navLinks = ['home', 'about', 'skills'];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass-panel"
      style={{
        position: 'fixed',
        top: '1rem',
        left: '0',
        right: '0',
        margin: '0 auto',
        width: '95%',
        maxWidth: '1300px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.8rem 2rem',
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 15px var(--accent-glow)'
      }}
    >
      <div style={{ flex: '1 1 0', display: 'flex', alignItems: 'center', gap: '1rem', fontFamily: '"Share Tech Mono", monospace', fontSize: '1.6rem', fontWeight: 400, minWidth: 0 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }} className="text-gradient">
          <div className="logo-glow-effect" style={{ display: 'flex', borderRadius: '50%', padding: '2px' }}>
            <img src={logoUrl} alt="Logo" style={{ height: '36px', width: 'auto', borderRadius: '50%', flexShrink: 0 }} />
          </div>
          <span style={{ whiteSpace: 'nowrap' }}>BCT0902</span>
        </Link>
      </div>

      <ul style={{ flex: 2, display: 'flex', justifyContent: 'center', gap: '2rem', listStyle: 'none', alignItems: 'center' }}>
          {navLinks.map((link) => (
            <li key={link}>
              <a 
                href={`/#${link}`} 
                style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  opacity: 0.8
                }}
                onMouseOver={(e) => {
                  e.target.style.opacity = 1;
                  e.target.style.color = 'var(--accent-main)';
                }}
                onMouseOut={(e) => {
                  e.target.style.opacity = 0.8;
                  e.target.style.color = 'inherit';
                }}
              >
                {t(`nav.${link}`)}
              </a>
            </li>
          ))}
          <li>
            <Link 
              to="/utilities" 
              style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                opacity: 0.8,
                color: 'var(--accent-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = 1}
              onMouseOut={(e) => e.currentTarget.style.opacity = 0.8}
            >
              <Zap size={18} /> TIỆN ÍCH
            </Link>
          </li>
      </ul>

      <div style={{ flex: '1 1 0', display: 'flex', justifyContent: 'flex-end', gap: '1.2rem', alignItems: 'center', minWidth: 0 }}>
        <button onClick={toggleLanguage} style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
          <Globe size={20} />
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{i18n.language.toUpperCase()}</span>
        </button>
        
        <button onClick={toggleTheme} style={{ color: 'var(--text-primary)', flexShrink: 0 }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div style={{ width: '1px', height: '20px', background: 'var(--bg-glass-border)', flexShrink: 0 }} />

        <Link to="/login" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          background: 'var(--accent-main)',
          color: '#fff',
          fontSize: '0.85rem',
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 0 15px var(--accent-glow)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <User size={18} />
          <span>LOGIN</span>
        </Link>
      </div>
    </motion.nav>
  );
};

export default Navbar;
