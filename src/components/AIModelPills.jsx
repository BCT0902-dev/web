import React from 'react';
import { Sparkles, Brain, Zap } from 'lucide-react';

const AIModelPills = ({ selectedModel, onModelChange }) => {
  const models = [
    { 
      id: 'groq', 
      name: 'Groq', 
      icon: <Zap size={16} />, 
      color: '#F4511E',
      branding: 'linear-gradient(135deg, #F4511E 0%, #FFB300 100%)'
    },
    { 
      id: 'deepseek', 
      name: 'DeepSeek', 
      icon: <Brain size={16} />, 
      color: '#673AB7',
      branding: 'linear-gradient(135deg, #673AB7 0%, #2196F3 100%)'
    },
    { 
      id: 'gemini', 
      name: 'Gemini', 
      icon: <Sparkles size={16} />, 
      color: '#4285F4',
      branding: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)'
    }
  ];

  return (
    <div className="iris-model-selection" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
      {models.map(model => (
        <button
          key={model.id}
          onClick={() => onModelChange(model.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            padding: '0.8rem 1.5rem',
            borderRadius: '16px',
            border: `1px solid ${selectedModel === model.id ? model.color : 'rgba(0,0,0,0.05)'}`,
            background: selectedModel === model.id ? 'var(--bg-primary)' : 'rgba(255,255,255,0.8)',
            color: selectedModel === model.id ? model.color : '#666',
            fontSize: '0.9rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            boxShadow: selectedModel === model.id ? `0 10px 25px ${model.color}33, 0 0 20px ${model.color}22` : '0 4px 12px rgba(0,0,0,0.02)',
            transform: selectedModel === model.id ? 'scale(1.05)' : 'scale(1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {selectedModel === model.id && (
            <motion.div 
              layoutId="pill-glow"
              style={{
                position: 'absolute',
                inset: 0,
                background: model.branding,
                opacity: 0.12,
                zIndex: 0
              }}
            />
          )}
          <div style={{ 
            background: model.branding,
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            zIndex: 1,
            color: 'white'
          }}>
            {model.icon}
          </div>
          <span style={{ zIndex: 1, marginLeft: '0.8rem' }}>{model.name}</span>
        </button>
      ))}
    </div>
  );
};

export default AIModelPills;
