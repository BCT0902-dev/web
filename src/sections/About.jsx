import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const CodeTypewriter = () => {
  const codeContent = [
    { line: 0, text: "const Dell_phai_developer = {", tokens: [
      { text: "const ", color: "var(--accent-secondary)" },
      { text: "Dell_phai_developer", color: "var(--accent-main)" },
      { text: " = {", color: "" }
    ]},
    { line: 1, text: "  name: 'BCT0902',", tokens: [
      { text: "  name: ", color: "" },
      { text: "'BCT0902'", color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 2, text: "  role: '12lon Tiger/ 2 dia moi',", tokens: [
      { text: "  role: ", color: "" },
      { text: "'12lon Tiger/ 2 dia moi'", color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 3, text: "  coffee: true,", tokens: [
      { text: "  coffee: ", color: "" },
      { text: "true", color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 4, text: "  skills: [", tokens: [
      { text: "  skills: [", color: "" }
    ]},
    { line: 5, text: "    'Wrong code',", tokens: [
      { text: "    'Wrong code'", color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 7, text: "    'wrong logic',", tokens: [
      { text: "    'wrong logic'", color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 8, text: "    'wrong design',", tokens: [
      { text: "    'wrong design'", color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 9, text: "    'wrong because handsome'", tokens: [
      { text: "    'wrong because handsome'", color: "#10b981" }
    ]},
    { line: 10, text: "  ]", tokens: [
      { text: "  ]", color: "" }
    ]},
    { line: 11, text: "};", tokens: [
      { text: "};", color: "" }
    ]}
  ];

  // Starting typing effect from 'wrong design' (index 7 in codeContent)
  const startIndex = 7;
  const staticText = codeContent.slice(0, startIndex).map(l => l.text).join('\n') + '\n';
  const dynamicText = codeContent.slice(startIndex).map(l => l.text).join('\n');
  const fullText = staticText + dynamicText;
  
  const [visibleChars, setVisibleChars] = useState(staticText.length);

  useEffect(() => {
    let timer;
    const startTyping = () => {
      timer = setInterval(() => {
        setVisibleChars(prev => {
          if (prev < fullText.length) return prev + 1;
          clearInterval(timer);
          setTimeout(() => {
            setVisibleChars(staticText.length);
            startTyping();
          }, 3000); // 3 second pause then loop
          return prev;
        });
      }, 50);
    };

    startTyping();
    return () => clearInterval(timer);
  }, [fullText.length, staticText.length]);

  let globalCharCount = 0;

  return (
    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6rem', minHeight: '260px' }}>
      {codeContent.map((lineData, lineIdx) => {
        const lineStart = globalCharCount;
        globalCharCount += lineData.text.length + 1;
        
        return (
          <div key={lineIdx} style={{ whiteSpace: 'pre' }}>
            {lineData.tokens.map((token, tokenIdx) => {
              const tokenStartInLine = lineData.text.indexOf(token.text);
              const charsInLineSoFar = visibleChars - lineStart;
              
              if (charsInLineSoFar <= tokenStartInLine) return null;
              
              const displayedToken = token.text.slice(0, charsInLineSoFar - tokenStartInLine);
              
              return (
                <span key={tokenIdx} style={{ color: token.color }}>
                  {displayedToken}
                </span>
              );
            })}
            {visibleChars >= lineStart && visibleChars < globalCharCount && (
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ borderLeft: '2px solid var(--accent-main)', marginLeft: '1px' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const BioTerminal = () => {
  const bioContent = [
    { line: 0, text: "const PersonalInfo = {", tokens: [
      { text: "const ", color: "var(--accent-secondary)" },
      { text: "PersonalInfo", color: "var(--accent-main)" },
      { text: " = {", color: "" }
    ]},
    { line: 1, text: "  age: 25,", tokens: [
      { text: "  age: ", color: "" },
      { text: "25", color: "#f59e0b" },
      { text: ",", color: "" }
    ]},
    { line: 2, text: "  hometown: 'Hà Tĩnh',", tokens: [
      { text: "  hometown: ", color: "" },
      { text: "'Hà Tĩnh'", color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 3, text: "  residence: 'Lâm Đồng',", tokens: [
      { text: "  residence: ", color: "" },
      { text: "'Lâm Đồng'", color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 4, text: "  major: 'Information Technology',", tokens: [
      { text: "  major: ", color: "" },
      { text: "'Information Technology'", color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 5, text: "  hobbies: [", tokens: [
      { text: "  hobbies: [", color: "" }
    ]},
    { line: 6, text: "    'music',", tokens: [
      { text: "    'music'", color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 7, text: "    'walking',", tokens: [
      { text: "    'walking'", color: "#10b981" },
      { text: ",", color: "" }
    ]},
    { line: 8, text: "    'eating apples'", tokens: [
      { text: "    'eating apples'", color: "#10b981" }
    ]},
    { line: 9, text: "  ]", tokens: [
      { text: "  ]", color: "" }
    ]},
    { line: 10, text: "};", tokens: [
      { text: "};", color: "" }
    ]}
  ];

  // Starting typing effect from 'walking' (index 7 in bioContent)
  const startIndex = 7;
  const staticText = bioContent.slice(0, startIndex).map(l => l.text).join('\n') + '\n';
  const dynamicText = bioContent.slice(startIndex).map(l => l.text).join('\n');
  const fullText = staticText + dynamicText;

  const [visibleChars, setVisibleChars] = useState(staticText.length);

  useEffect(() => {
    let timer;
    const startTyping = () => {
      timer = setInterval(() => {
        setVisibleChars(prev => {
          if (prev < fullText.length) return prev + 1;
          clearInterval(timer);
          setTimeout(() => {
            setVisibleChars(staticText.length);
            startTyping();
          }, 3000); // 3 second pause
          return prev;
        });
      }, 40);
    };

    startTyping();
    return () => clearInterval(timer);
  }, [fullText.length, staticText.length]);

  let globalCharCount = 0;

  return (
    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6rem', minHeight: '280px', fontFamily: 'var(--font-mono)' }}>
      {bioContent.map((lineData, lineIdx) => {
        const lineStart = globalCharCount;
        globalCharCount += lineData.text.length + 1;
        
        return (
          <div key={lineIdx} style={{ whiteSpace: 'pre' }}>
            {lineData.tokens.map((token, tokenIdx) => {
              const tokenStartInLine = lineData.text.indexOf(token.text);
              const charsInLineSoFar = visibleChars - lineStart;
              if (charsInLineSoFar <= tokenStartInLine) return null;
              const displayedToken = token.text.slice(0, charsInLineSoFar - tokenStartInLine);
              return <span key={tokenIdx} style={{ color: token.color }}>{displayedToken}</span>;
            })}
            {visibleChars >= lineStart && visibleChars < globalCharCount && (
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.8, repeat: Infinity }} style={{ borderLeft: '2px solid var(--accent-main)', marginLeft: '1px' }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const About = () => {
  const { t } = useTranslation();

  return (
    <section id="about" className="container" style={{ padding: '4rem 2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'start' }}>
        
        {/* Bio Terminal (Black background as requested) */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="glass-panel"
          style={{ 
            padding: '2rem', 
            background: '#0a0a0a', 
            border: '1px solid #222', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)' 
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #222', paddingBottom: '1rem' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
            <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>bio.js</span>
          </div>
          <BioTerminal />
        </motion.div>

        {/* Coding Terminal */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="glass-panel"
          style={{ padding: '2rem', fontFamily: 'var(--font-mono)', minHeight: '260px' }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--bg-glass-border)', paddingBottom: '1rem' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--danger)' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--success)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>coding.js</span>
          </div>
          
          <CodeTypewriter />
        </motion.div>

      </div>
    </section>
  );
};

export default About;
