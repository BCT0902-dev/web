import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Bot } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0c',
      position: 'relative',
      overflow: 'hidden',
      padding: '2rem'
    }}>
      {/* Background Ambient Glows */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(0, 104, 255, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 1,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(0, 255, 136, 0.05) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 1,
        pointerEvents: 'none'
      }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          width: '100%',
          maxWidth: '600px',
          padding: '4rem 2rem',
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '40px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          zIndex: 10
        }}
      >
        <motion.div
           animate={{ 
             y: [0, -15, 0],
             rotate: [0, 2, -2, 0]
           }}
           transition={{ 
             duration: 4, 
             repeat: Infinity, 
             ease: "easeInOut" 
           }}
           style={{ marginBottom: '2rem', display: 'inline-block' }}
        >
          <div style={{
            padding: '1.5rem',
            background: 'var(--accent-main, #0068ff)',
            borderRadius: '24px',
            boxShadow: '0 0 30px rgba(0, 104, 255, 0.3)',
            color: '#fff'
          }}>
            <Bot size={48} />
          </div>
        </motion.div>

        <h1 style={{
          fontSize: 'clamp(6rem, 15vw, 10rem)',
          fontWeight: 900,
          margin: '0',
          lineHeight: '1',
          fontFamily: "'Chakra Petch', sans-serif",
          background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.4) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          position: 'relative'
        }}>
          404
        </h1>

        <h2 style={{
          fontSize: '1.5rem',
          color: '#fff',
          fontFamily: "'Chakra Petch', sans-serif",
          margin: '1rem 0 0.5rem',
          letterSpacing: '1px'
        }}>
          KHÔNG TÌM THẤY TRANG
        </h2>

        <p style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '1rem',
          lineHeight: '1.6',
          marginBottom: '3rem'
        }}>
          Xin lỗi ngài, có vẻ như đường dẫn này đã bị "mất tích" khỏi hệ thống IRIS. 
          Vui lòng quay lại trung tâm điều khiển chính.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{
              padding: '1rem 1.8rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <ArrowLeft size={18} /> QUAY LẠI
          </button>

          <button 
            onClick={() => navigate('/')}
            style={{
              padding: '1rem 1.8rem',
              borderRadius: '16px',
              border: 'none',
              background: 'var(--accent-main, #0068ff)',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              transition: 'all 0.3s',
              boxShadow: '0 10px 20px -5px rgba(0, 104, 255, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(0, 104, 255, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0, 104, 255, 0.3)';
            }}
          >
            <Home size={18} /> TRANG CHỦ
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
