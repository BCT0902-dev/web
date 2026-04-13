import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Activity, Send, CheckCircle, Clock, Save, User, ArrowRight, Bot, Info } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp } from 'firebase/firestore';

const WaterReminder = () => {
  const { config } = useConfig();
  const [formData, setFormData] = useState({ 
    name: '', 
    height: '', 
    weight: '', 
    chat_id: localStorage.getItem('iris_chat_id') || '' 
  });
  const [activeSession, setActiveSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  
  // Zalo Sync States
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncCode, setSyncCode] = useState(null);

  // Gemini & Zalo Config from Context
  const geminiKey = config?.integrations?.geminiKey;
  const zaloBotId = config?.integrations?.zaloBotId;

  // Auto-load session from Firestore
  useEffect(() => {
    if (formData.chat_id) {
      const unsubscribe = onSnapshot(doc(db, 'hydration_sessions', formData.chat_id), (snap) => {
        if (snap.exists()) {
          setActiveSession(snap.data());
        } else {
          setActiveSession(null);
        }
      });
      return () => unsubscribe();
    }
  }, [formData.chat_id]);

  const startSync = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSyncCode(code);
    setShowSyncModal(true);
    try {
      await setDoc(doc(db, 'zalo_sync', code), { status: 'pending', created_at: serverTimestamp() });
      const unsubscribe = onSnapshot(doc(db, 'zalo_sync', code), (snapshot) => {
        if (snapshot.exists() && snapshot.data().status === 'completed') {
          const newId = snapshot.data().chat_id;
          setFormData(prev => ({ ...prev, chat_id: newId }));
          localStorage.setItem('iris_chat_id', newId);
          setTimeout(() => { setShowSyncModal(false); deleteDoc(doc(db, 'zalo_sync', code)); unsubscribe(); }, 2000);
        }
      });
    } catch (err) { alert("Lỗi kết nối bộ nhớ xác thực!"); }
  };

  const calculateAndStart = async () => {
    if (!formData.name || !formData.weight || !formData.chat_id) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setIsLoading(true);
    setStatus('🔍 AI đang lập kế hoạch cá nhân hóa cho ngài...');

    try {
      const baseLiters = (Number(formData.weight) * 0.033).toFixed(1);
      let aiSchedule = [];
      
      if (geminiKey) {
        const prompt = `Tính toán lịch trình uống nước khoa học cho: ${formData.name}, ${formData.weight}kg, ${formData.height}cm. Mục tiêu: ${baseLiters}L. Trả về JSON mảng: [ { "time": "HH:mm", "amount": "250ml", "note": "Ghi chú" } ]`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const cleanedJson = data.candidates?.[0]?.content?.parts?.[0]?.text.replace(/```json|```/g, '').trim();
        aiSchedule = JSON.parse(cleanedJson).map(item => ({ ...item, status: 'pending' }));
      }

      if (!aiSchedule.length) {
        aiSchedule = [
          { time: "07:00", amount: "300ml", note: "Thức dậy", status: 'pending' },
          { time: "09:00", amount: "250ml", note: "Bắt đầu việc", status: 'pending' },
          { time: "11:30", amount: "250ml", note: "Trước trưa", status: 'pending' },
          { time: "14:00", amount: "250ml", note: "Chiều", status: 'pending' },
          { time: "16:30", amount: "250ml", note: "Cuối ngày", status: 'pending' },
          { time: "19:00", amount: "250ml", note: "Tối", status: 'pending' },
          { time: "21:30", amount: "200ml", note: "Trước ngủ", status: 'pending' }
        ];
      }

      const sessionData = {
        ...formData,
        total_target: Number(baseLiters),
        consumed: 0,
        schedule: aiSchedule,
        intro_sent: false,
        intro_at: serverTimestamp(), // Will be handled by cron 3 mins later roughly
        updated_at: serverTimestamp()
      };

      await setDoc(doc(db, 'hydration_sessions', formData.chat_id), sessionData);
      localStorage.setItem('iris_chat_id', formData.chat_id);
      
      // Send initial plan via Zalo
      const scheduleLines = aiSchedule.map(s => `🔹 ${s.time}: ${s.amount} (${s.note})`).join('\n');
      await fetch('/api/send-notif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: formData.chat_id,
          text: `💧 KẾ HOẠCH HYDRATION CỦA ${formData.name.toUpperCase()}\nMục tiêu: ${baseLiters} Lít/ngày\n\nLỊCH TRÌNH:\n${scheduleLines}\n\nEm sẽ chủ động nhắc ngài đúng giờ nhé! 🚀`
        })
      });

      setStatus('🚀 Đã kích hoạt hệ thống nhắc nhở!');
    } catch (e) { setStatus('❌ Lỗi thiết lập.'); } finally { setIsLoading(false); }
  };

  const cancelPlan = async () => {
    if (window.confirm("Ngài chắc chắn muốn hủy kế hoạch hiện tại chứ?")) {
      await deleteDoc(doc(db, 'hydration_sessions', formData.chat_id));
      setActiveSession(null);
      setStatus('🗑️ Đã hủy kế hoạch.');
    }
  };

  return (
    <div className="water-reminder-container" style={{ padding: '80px 2rem 2rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: -1 }} />
      
      {/* Sync Modal */}
      <AnimatePresence>
        {showSyncModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '400px', background: '#1a1a1f', padding: '2.5rem', borderRadius: '32px', textAlign: 'center' }}>
              <Bot size={48} color="var(--accent-main)" />
              <h2 style={{ color: '#fff', margin: '1rem 0' }}>Kết nối Zalo Bot</h2>
              <p style={{ color: '#aaa', marginBottom: '2rem' }}>Nhắn "ID" cho Bot để nhận mã định danh.</p>
              <a href={`https://zalo.me/${zaloBotId}`} target="_blank" rel="noreferrer" style={{ display: 'block', background: '#0068ff', color: '#fff', padding: '1rem', borderRadius: '14px', textDecoration: 'none', fontWeight: 'bold' }}>MỞ ZALO</a>
              <button onClick={() => setShowSyncModal(false)} style={{ background: 'transparent', color: '#666', border: 'none', marginTop: '1rem' }}>QUAY LẠI</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="water-header glass-panel" style={{ padding: '2.5rem', borderRadius: '32px', background: 'rgba(30,144,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ background: 'var(--accent-main)', padding: '1rem', borderRadius: '18px' }}><Droplets size={32} color="#fff" /></div>
          <div>
            <h1 style={{ fontSize: '2rem', color: '#fff' }}>NHẮC NHỞ UỐNG NƯỚC AI v3</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>{activeSession ? `Đang theo dõi mục tiêu của ngài ${activeSession.name}` : 'Thiết lập mục tiêu sức khỏe của ngài.'}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: activeSession ? '1fr' : '1fr 1fr', gap: '2rem' }}>
        {!activeSession ? (
          <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ color: 'var(--accent-main)' }}>1. THIẾT LẬP THÔNG TIN</h3>
            <div className="input-group-modern">
              <label style={{ color: '#fff' }}>TÊN CỦA NGÀI</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', padding: '1rem', borderRadius: '14px', color: '#fff' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group-modern">
                <label style={{ color: '#fff' }}>CHIỀU CAO (CM)</label>
                <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', padding: '1rem', borderRadius: '14px', color: '#fff' }} />
              </div>
              <div className="input-group-modern">
                <label style={{ color: '#fff' }}>CÂN NẶNG (KG)</label>
                <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', padding: '1rem', borderRadius: '14px', color: '#fff' }} />
              </div>
            </div>
            <div className="input-group-modern">
              <label style={{ color: '#fff' }}>ZALO CHAT ID</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input type="text" value={formData.chat_id} onChange={e => { setFormData({...formData, chat_id: e.target.value}); localStorage.setItem('iris_chat_id', e.target.value); }} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--accent-main)', padding: '1rem', borderRadius: '14px', color: '#fff' }} />
                <button onClick={startSync} style={{ background: '#0068ff', color: '#fff', border: 'none', padding: '0 1rem', borderRadius: '14px' }}><Bot size={20} /></button>
              </div>
            </div>
            <button onClick={calculateAndStart} disabled={isLoading} style={{ marginTop: '1rem', padding: '1.2rem', borderRadius: '18px', background: 'var(--accent-main)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1.1rem' }}>
              {isLoading ? <Activity className="spin" /> : 'KÍCH HOẠT NHẮC NHỞ AI'}
            </button>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '32px', background: 'rgba(20,20,25,0.8)', border: '1px solid var(--accent-main)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ color: 'var(--accent-secondary)' }}>DASHBOARD HYDRATION</h3>
              <button onClick={cancelPlan} style={{ background: 'rgba(220,38,38,0.2)', color: '#ef4444', border: '1px solid #ef4444', padding: '0.6rem 1.2rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>HỦY KẾ HOẠCH</button>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-main)' }}>{activeSession.consumed} <span style={{ fontSize: '1rem', color: '#666' }}>/ {activeSession.total_target} LÍT</span></div>
              <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginTop: '1rem', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${(activeSession.consumed / activeSession.total_target) * 100}%` }} style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-main), var(--accent-secondary))' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {activeSession.schedule?.map((item, idx) => (
                <div key={idx} style={{ 
                  padding: '1.2rem', 
                  borderRadius: '20px', 
                  background: item.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${item.status === 'completed' ? '#10b981' : 'rgba(255,255,255,0.05)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  opacity: item.status === 'completed' ? 0.6 : 1
                }}>
                  {item.status === 'completed' ? <CheckCircle size={20} color="#10b981" /> : <Clock size={20} color="var(--accent-main)" />}
                  <div>
                    <div style={{ color: '#fff', fontWeight: 'bold' }}>{item.time} - {item.amount}</div>
                    <div style={{ color: '#aaa', fontSize: '0.8rem' }}>{item.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .input-group-modern { display: flex; flex-direction: column; gap: 0.5rem; }
        .input-group-modern label { font-size: 0.75rem; color: #888; font-weight: bold; letter-spacing: 1px; }
      `}</style>
    </div>
  );
};


export default WaterReminder;
