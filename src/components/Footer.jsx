import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();

  const socials = [
    { 
      name: "Facebook",
      brandColor: "#1877F2",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>, 
      url: "#" 
    },
    { 
      name: "Github",
      brandColor: "#2ea44f",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7a3.37 3.37 0 0 0-.94 2.58V22"></path></svg>, 
      url: "#" 
    },
    { 
      name: "LinkedIn",
      brandColor: "#0A66C2",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>, 
      url: "#" 
    },
    { 
      name: "Youtube",
      brandColor: "#FF0000",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.14 1 12 1 12s0 3.86.46 5.58a2.78 2.78 0 0 0 1.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.86 23 12 23 12s0-3.86-.46-5.58z"></path><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon></svg>, 
      url: "#" 
    },
    { 
      name: "Messenger",
      brandColor: "#0084FF",
      icon: <MessageSquare size={20} />, 
      url: "#" 
    }
  ];

  return (
    <footer id="contact" style={{ 
      borderTop: '1px solid var(--bg-glass-border)',
      padding: '2rem 2rem 2rem',
      marginTop: '1rem'
    }}>
      <div className="container" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: '2.5rem'
      }}>
        
        <h2 style={{ fontSize: '2.5rem', fontFamily: '"Share Tech Mono", monospace' }} className="text-gradient">
          BCT0902
        </h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem' }}>
          {socials.map((social, idx) => (
            <a 
              key={idx} 
              href={social.url} 
              className="glass-panel" 
              style={{ 
                padding: '1rem', 
                display: 'flex', 
                transition: 'all 0.3s ease' 
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.borderColor = social.brandColor;
                e.currentTarget.style.boxShadow = `0 10px 20px -10px ${social.brandColor}55`;
                e.currentTarget.querySelector('svg').style.color = social.brandColor;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--bg-glass-border)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.querySelector('svg').style.color = 'inherit';
              }}
            >
              {social.icon}
            </a>
          ))}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <a href="#projects" className="btn-primary" style={{ padding: '0.8rem 2.5rem' }}>
            XEM DỰ ÁN
          </a>
        </div>

        <p style={{ 
          color: 'var(--text-secondary)', 
          fontFamily: 'var(--font-mono)',
          fontSize: '0.9rem',
          textAlign: 'center',
          maxWidth: '500px',
          lineHeight: 1.6
        }}>
          Hãy lướt lên để xem kỹ hơn hoặc bấm vào các icon social xinh xinh bên trên.
          <br />
          <span style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '1rem', display: 'block' }}>
            &copy; {new Date().getFullYear()} BCT0902. All rights reserved.
          </span>
        </p>

      </div>
    </footer>
  );
};

export default Footer;
