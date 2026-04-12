import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Bot, Zap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './FloatingChatBtn.css';

const FloatingChatBtn = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide the button if we are already on the chat page or login page
  const hidePaths = ['/utilities/chat', '/login'];
  if (hidePaths.includes(location.pathname)) return null;

  return (
    <div className="floating-chat-container">
      <motion.button
        className="floating-chat-btn"
        onClick={() => navigate('/utilities/chat')}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
      >
        <div className="pulse-ring" />
        <div className="pulse-ring delay-1" />
        <div className="btn-content">
          <Bot size={28} />
          <div className="badge-online" />
        </div>
      </motion.button>
      
      <div className="tooltip-chat">
        Hỏi AI Assistant
      </div>
    </div>
  );
};

export default FloatingChatBtn;
