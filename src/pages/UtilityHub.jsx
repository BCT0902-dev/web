import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Play, Utensils, Terminal, Shield, Zap, Cpu, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './UtilityHub.css';

const UtilityHub = () => {
  const navigate = useNavigate();

  const utilities = [
    {
      id: 'chat',
      title: 'AI CHAT CORE',
      description: 'Có những lúc code báo lỗi đỏ lòm mà không biết tại sao? Hay cần một người bạn ảo có thể hiểu bạn ngay cả khi bạn ốm? Vào đây chia sẻ cùng tôi nhé.',
      image: '/thumbnails/chat_ai.png',
      status: 'ACTIVE',
      path: '/utilities/chat',
      metadata: 'VER: 3.8.2 | TYPE: NLP_PROTOCOL'
    },
    {
      id: 'youtube',
      title: 'YT SMART ANALYZER',
      description: 'Tìm được video YouTube hướng dẫn cực xịn nhưng mà nó dài tận 2 tiếng và toàn tiếng nước ngoài? Đưa link đây, để mình xử lý tóm tắt và dịch thuật cho.',
      image: '/thumbnails/yt_analyzer.png',
      status: 'ACTIVE',
      path: '/utilities/youtube',
      metadata: 'VER: 1.0.0 | TYPE: MEDIA_AI'
    },
    {
      id: 'chef',
      title: 'BCT CHEF',
      description: 'Haizz tủ lạnh còn quá nhiều đồ hoặc có thể chỉ có vài món, vậy giờ làm gì để lấp đầy chiếc bụng đói này đây. Nhập vào bên dưới đi, chúng mình cùng nghiên cứu xem nên nấu món gì.',
      image: '/thumbnails/chef_ai.png',
      status: 'ACTIVE',
      path: '/utilities/chef',
      metadata: 'VER: 1.0.0 | TYPE: KITCHEN_AI'
    },
    {
      id: 'terminal',
      title: 'DEV TERMINAL',
      description: 'Khoang điều khiển trung tâm dành cho hệ thống. Phân khu này đang bị khóa và chỉ dành riêng cho quyền Root.',
      image: '/thumbnails/terminal.png',
      status: 'LOCKED',
      path: '#',
      metadata: 'SECURED | TYPE: ROOT_ACCESS'
    }
  ];

  return (
    <div className="utility-hub-container">
      <div className="museum-scanlines" />
      
      <div className="hub-header">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1>PHÒNG TRƯNG BÀY</h1>
          <p>Nơi lưu giữ những mảnh ghép kỹ thuật số, những dự án nhỏ nhưng mang theo bao tâm huyết của tôi.</p>
        </motion.div>
      </div>

      <div className="utility-grid">
        {utilities.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: idx * 0.2 }}
            className={`utility-card ${item.status === 'LOCKED' ? 'disabled' : ''}`}
            onClick={() => item.status !== 'LOCKED' && navigate(item.path)}
          >
            <div className="exhibit-display">
              <div className="artifact-glow" />
              <div className="card-image-box">
                <img src={item.image} alt={item.title} className="exhibit-image" />
              </div>
            </div>

            <div className="exhibit-info">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              
              <div className="exhibit-meta">
                <span className="exhibit-id">{item.metadata}</span>
                {item.status === 'ACTIVE' && (
                  <div className="launch-btn">
                    <Zap size={14} /> <span>EXPLORE</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="hub-footer">
        <p>INTERNAL ACCESS PROTOCOL • SESSION: ACTIVE • ENCRYPTION: ROT-256</p>
      </div>
    </div>
  );
};

export default UtilityHub;
