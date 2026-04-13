import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Settings } from 'lucide-react';
import AIChat from './AIChat';
import UtilityHub from './UtilityHub';
import YoutubeAnalyzer from './YoutubeAnalyzer';
import ChefAssistant from './ChefAssistant';
import WaterReminder from './WaterReminder';
import { useConfig } from '../context/ConfigContext';
import './Utilities.css';

const Utilities = () => {
  const { config } = useConfig();
  const blurValue = config?.appearance?.utilityGlassBlur || 15;

  return (
    <div className="utilities-dashboard">
      <main 
        className="dashboard-content full-width"
        style={{ 
          background: 'var(--utility-bg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backdropFilter: `blur(${blurValue}px)`,
          WebkitBackdropFilter: `blur(${blurValue}px)`
        }}
      >
        <div className="utility-canvas">
          <Routes>
            <Route path="/" element={<UtilityHub />} />
            <Route path="/chat" element={<AIChat />} />
            <Route path="/youtube" element={<YoutubeAnalyzer />} />
            <Route path="/chef" element={<ChefAssistant />} />
            <Route path="/water" element={<WaterReminder />} />
            <Route path="/settings" element={
              <div className="settings-placeholder" style={{ background: 'var(--bg-primary)', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Settings size={64} opacity={0.1} />
                <h2 style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-main)', marginTop: '1rem' }}>Cài đặt hệ thống</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Tính năng này đang được phát triển.</p>
              </div>
            } />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Utilities;
