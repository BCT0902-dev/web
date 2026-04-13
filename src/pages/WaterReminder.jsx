import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Activity, Send, CheckCircle, Clock, Save, User, ArrowRight, Bot, Info } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp } from 'firebase/firestore';

const WaterReminder = () => {
  const { config } = useConfig();
  const [formData, setFormData] = useState({ name: '', height: '', weight: '', chat_id: '' });
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [isSent, setIsSent] = useState(false);
  
  // Zalo Sync States
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncCode, setSyncCode] = useState(null);
  const [syncStatus, setSyncStatus] = useState('pending'); // pending, completed

  // Gemini & Zalo Config from Context
  const geminiKey = config?.integrations?.geminiKey;
  const zaloToken = config?.integrations?.zaloBotToken;
  const zaloBotId = config?.integrations?.zaloBotId;

  const startSync = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSyncCode(code);
    setSyncStatus('pending');
    setShowSyncModal(true);

    // Initial doc in firestore
    try {
      await setDoc(doc(db, 'zalo_sync', code), {
        status: 'pending',
        created_at: serverTimestamp(),
      });

      // Listen for updates from backend webhook
      const unsubscribe = onSnapshot(doc(db, 'zalo_sync', code), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.status === 'completed') {
            setSyncStatus('completed');
            setFormData(prev => ({ ...prev, chat_id: data.chat_id }));
            
            // Clean up after 3 seconds
            setTimeout(async () => {
              setShowSyncModal(false);
              await deleteDoc(doc(db, 'zalo_sync', code));
              unsubscribe();
            }, 3000);
          }
        }
      });
    } catch (err) {
      console.error("Sync error:", err);
      alert("Lỗi kết nối bộ nhớ xác thực!");
    }
  };

  const calculateHydration = async () => {
    if (!formData.name || !formData.weight) {
      alert("Vui lòng điền tên và cân nặng!");
      return;
    }

    setIsLoading(true);
    setStatus('🔍 AI đang phân tích thể trạng của ngài...');

    try {
      // Basic Local Formula Fallback
      const baseLiters = (Number(formData.weight) * 0.033).toFixed(1);
      
      let aiSchedule = [];
      
      if (geminiKey) {
        const prompt = `Tính toán lịch trình uống nước khoa học cho: 
        Họ tên: ${formData.name}, Cân nặng: ${formData.weight}kg, Chiều cao: ${formData.height}cm. 
        Mục tiêu tổng: ${baseLiters} lít/ngày. 
        Hãy chia nhỏ lịch trình từ 7:00 sáng đến 21:00 tối thành các mốc cụ thể. 
        Trả về kết quả dưới dạng JSON mảng các đối tượng: 
        [ { "time": "HH:mm", "amount": "250ml", "note": "Ghi chú ngắn" } ] 
        Chỉ trả về JSON, không kèm văn bản khác.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        try {
          const cleanedJson = textResponse.replace(/```json|```/g, '').trim();
          aiSchedule = JSON.parse(cleanedJson);
        } catch (e) {
          console.error("AI JSON Parse fail", e);
        }
      }

      // Default schedule if AI fails or no key
      if (aiSchedule.length === 0) {
        aiSchedule = [
          { time: "07:00", amount: "300ml", note: "Ngay khi thức dậy" },
          { time: "09:00", amount: "250ml", note: "Bắt đầu làm việc" },
          { time: "11:00", amount: "250ml", note: "Trước bữa trưa" },
          { time: "13:30", amount: "250ml", note: "Sau nghỉ trưa" },
          { time: "15:30", amount: "250ml", note: "Giữa chiều" },
          { time: "17:30", amount: "250ml", note: "Trước khi về" },
          { time: "19:30", amount: "250ml", note: "Sau bữa tối" },
          { time: "21:00", amount: "200ml", note: "Trước khi ngủ" }
        ];
      }

      setResult({
        total: baseLiters,
        schedule: aiSchedule
      });
      setStatus('✅ Đã lập kế hoạch thành công!');
    } catch (error) {
      console.error(error);
      setStatus('❌ Lỗi tính toán AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendToZalo = async () => {
    if (!zaloToken || !formData.chat_id || !result) {
      alert("Thiếu Token Zalo hoặc Chat ID người nhận!");
      return;
    }

    setIsSent(false);
    setStatus('📡 Đang gửi lịch trình đến Zalo Bot...');

    try {
      const scheduleStr = result.schedule.map(s => `🔹 ${s.time}: ${s.amount} (${s.note})`).join('\n');
      const message = `💧 BẢN TIN HYDRATION - IRIS AI\n\nChào ${formData.name},\nTổng lượng nước cần nạp hôm nay: ${result.total} Lít.\n\nLỊCH TRÌNH:\n${scheduleStr}\n\nChúc bạn một ngày làm việc tràn đầy năng lượng! 🚀`;

      const response = await fetch(`https://bot-api.zaloplatforms.com/bot${zaloToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: formData.chat_id,
          text: message
        })
      });

      const data = await response.json();
      if (data.ok) {
        setIsSent(true);
        setStatus('🚀 Đã gửi lời nhắc thành công đến Zalo!');
      } else {
        alert("Lỗi từ Zalo: " + (data.description || 'Không xác định'));
      }
    } catch (error) {
      alert("Lỗi kết nối Zalo API");
    }
  };

  return (
    <div className="water-reminder-container" style={{ padding: '2rem', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Sync Modal */}
      <AnimatePresence>
        {showSyncModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              style={{ width: '100%', maxWidth: '400px', background: 'rgba(30, 30, 35, 0.95)', padding: '2.5rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            >
              <Bot size={48} color="var(--accent-main)" style={{ marginBottom: '1.5rem' }} />
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>Xác thực Zalo</h2>
              
              {syncStatus === 'pending' ? (
                <>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                    Mở ứng dụng Zalo và gửi tin nhắn sau cho Bot:
                  </p>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '16px', border: '1px dashed var(--accent-main)', marginBottom: '2rem' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '8px', color: 'var(--accent-main)', fontFamily: 'var(--font-mono)' }}>{syncCode}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <a 
                      href={zaloBotId ? `https://zalo.me/${zaloBotId}` : '#'} 
                      target="_blank" rel="noreferrer"
                      style={{ background: '#0068ff', color: '#fff', padding: '1rem', borderRadius: '14px', textDecoration: 'none', fontWeight: 'bold' }}
                    >
                      MỞ ZALO BOT
                    </a>
                    <button onClick={() => setShowSyncModal(false)} style={{ color: 'rgba(255,255,255,0.4)', background: 'transparent', border: 'none', fontSize: '0.9rem' }}>HỦY BỎ</button>
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                   <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <CheckCircle size={48} style={{ marginBottom: '1rem' }} />
                      <h3 style={{ fontSize: '1.2rem' }}>KẾT NỐI THÀNH CÔNG!</h3>
                      <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8 }}>IRIS đã nhận dạng được tài khoản Zalo của ngài.</p>
                   </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="water-header glass-panel" style={{ padding: '2rem', borderRadius: '24px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(30,144,255,0.1), rgba(0,191,255,0.05))', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
          <div className="icon-badge" style={{ background: 'var(--accent-main)', color: '#fff', padding: '1rem', borderRadius: '16px', boxShadow: '0 0 20px rgba(var(--accent-rgb), 0.4)' }}>
            <Droplets size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontFamily: 'Chakra Petch', letterSpacing: '2px', color: '#fff' }}>NHẮC NHỞ UỐNG NƯỚC AI</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Tối ưu hóa sức khỏe bản thân cùng IRIS Hyper-Hydration.</p>
          </div>
        </div>
        
        {status && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '0.8rem 1.2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '0.9rem', color: 'var(--accent-main)', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-block' }}>
            {status}
          </motion.div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1.5fr' : '1fr', gap: '2rem', flex: 1 }}>
        
        {/* Step 1: Input Form */}
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--accent-main)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>1. THÔNG TIN CƠ THỂ</h3>
          
          <div className="input-group-modern">
            <label><User size={14} /> TÊN CỦA NGÀI</label>
            <input type="text" placeholder="Nhập tên..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', color: '#fff' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group-modern">
               <label>CHIỀU CAO (CM)</label>
               <input type="number" placeholder="170" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', color: '#fff' }} />
            </div>
            <div className="input-group-modern">
               <label>CÂN NẶNG (KG)</label>
               <input type="number" placeholder="65" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', color: '#fff' }} />
            </div>
          </div>

          <div className="input-group-modern" style={{ marginTop: '1rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span>ZALO CHAT ID</span>
               <button onClick={startSync} style={{ background: 'transparent', border: 'none', color: 'var(--accent-secondary)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                 <Bot size={14} /> NHẤN ĐỂ LẤY ID
               </button>
            </label>
            <input type="text" placeholder="Trống (Nhấn nút trên để lấy tự động)" value={formData.chat_id} readOnly style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', color: formData.chat_id ? '#10b981' : '#666', fontWeight: 'bold' }} />
          </div>

          <button 
            className="action-btn-water" 
            onClick={calculateHydration}
            disabled={isLoading}
            style={{ 
              marginTop: '1rem', 
              padding: '1.2rem', 
              borderRadius: '16px', 
              background: 'var(--accent-main)', 
              color: '#fff', 
              border: 'none', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.8rem',
              boxShadow: '0 10px 30px rgba(var(--accent-rgb), 0.3)'
            }}
          >
            {isLoading ? <Activity className="spin" size={20} /> : <Droplets size={20} />}
            LẬP KẾ HOẠCH AI
          </button>
        </div>

        {/* Step 2: Visualization & Zalo Push */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel"
              style={{ padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '2rem' }}
            >
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--accent-secondary)' }}>2. KẾ HOẠCH HYDRATION</h3>
                 <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-main)' }}>{result.total}</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>LÍT / NGÀY</span>
                 </div>
               </div>

               <div className="schedule-list" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {result.schedule.map((item, id) => (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                       <div style={{ minWidth: '70px', color: 'var(--accent-main)', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock size={16} /> {item.time}
                       </div>
                       <div style={{ flex: 1 }}>
                          <div style={{ color: '#fff', fontWeight: 600 }}>{item.amount}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.note}</div>
                       </div>
                    </div>
                  ))}
               </div>

               <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    className="zalo-push-btn" 
                    onClick={sendToZalo}
                    style={{ 
                      flex: 1, 
                      padding: '1.2rem', 
                      borderRadius: '16px', 
                      background: isSent ? '#10b981' : '#0068ff', 
                      color: '#fff', 
                      border: 'none', 
                      fontWeight: 'bold', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.8rem'
                    }}
                  >
                    {isSent ? <CheckCircle size={20} /> : <Bot size={20} />}
                    {isSent ? 'ĐÃ GỬI ZALO' : 'KÍCH HOẠT NHẮC NHỞ ZALO'}
                  </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .input-group-modern { display: flex; flex-direction: column; gap: 0.5rem; }
        .input-group-modern label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
      `}</style>
    </div>
  );
};

export default WaterReminder;
