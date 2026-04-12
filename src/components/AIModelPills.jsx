import React from 'react';
import { Sparkles, Cpu, Zap } from 'lucide-react';

const AIModelPills = ({ selectedModel, onModelChange, theme = 'dark' }) => {
  const models = [
    { id: 'gemini', name: 'Gemini', icon: <Sparkles size={14} />, color: '#00f0ff' },
    { id: 'deepseek', name: 'DeepSeek', icon: <Cpu size={14} />, color: '#b026ff' },
    { id: 'groq', name: 'Groq (Llama3)', icon: <Zap size={14} />, color: '#ff7300' }
  ];

  return (
    <div className="model-selection-wrapper" style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem' }}>
      {models.map(model => (
        <button
          key={model.id}
          onClick={() => onModelChange(model.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.5rem 1.2rem',
            borderRadius: '20px',
            border: '1px solid',
            borderColor: selectedModel === model.id ? model.color : 'rgba(255,255,255,0.1)',
            background: selectedModel === model.id ? `${model.color}15` : 'transparent',
            color: selectedModel === model.id ? model.color : 'rgba(255,255,255,0.5)',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            boxShadow: selectedModel === model.id ? `0 0 15px ${model.color}30` : 'none'
          }}
        >
          {model.icon}
          {model.name}
        </button>
      ))}
    </div>
  );
};

export default AIModelPills;
