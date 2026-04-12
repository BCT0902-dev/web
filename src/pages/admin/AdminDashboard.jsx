import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Globe, 
  Palette, 
  Key, 
  FileText, 
  Layout, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle,
  ExternalLink,
  Bot,
  Users,
  Home,
  Activity,
  Edit,
  X
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, setDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { config, loading } = useConfig();
  const [activeTab, setActiveTab] = useState('general');
  const [localConfig, setLocalConfig] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('');
  
  // Users state
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userModal, setUserModal] = useState({ isOpen: false, mode: 'add', data: {} });

  // API Test states
  const [apiTestStatus, setApiTestStatus] = useState({ gemini: '', deepseek: '' });

  useEffect(() => {
    if (config) {
      setLocalConfig(JSON.parse(JSON.stringify(config)));
    }
  }, [config]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = [];
      querySnapshot.forEach((docSnap) => {
        usersData.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsersList(usersData);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const deleteUserRecord = async (userId) => {
    if (!window.confirm('Ngài có chắc chắn muốn xoá hồ sơ này khỏi Database? (Thao tác này không xoá trong Firebase Auth gốc)')) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsersList(prev => prev.filter(u => u.id !== userId));
      alert("Đã xoá hồ sơ thành công!");
    } catch (err) {
      alert("Lỗi khi xoá: " + err.message);
    }
  };
  
  const saveUserRecord = async (e) => {
    e.preventDefault();
    const { id, email, username, firstName, lastName, role, displayName, photoURL } = userModal.data;
    
    // Auto-generate avatar if none provided
    const finalPhotoURL = photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${email || Math.random()}`;
    const finalDisplayName = displayName || (firstName ? `${lastName || ''} ${firstName}`.trim() : 'Người Dùng Tới BCT');
    
    const docData = {
       email: email || '',
       username: username || '',
       firstName: firstName || '',
       lastName: lastName || '',
       displayName: finalDisplayName,
       role: role || 'user',
       photoURL: finalPhotoURL,
       updatedAt: new Date()
    };
    
    try {
       const targetId = id || `manual_${Date.now()}`;
       await setDoc(doc(db, "users", targetId), docData, { merge: true });
       setUserModal({ isOpen: false, mode: 'add', data: {} });
       fetchUsers();
    } catch (err) {
       alert("Lỗi khi lưu: " + err.message);
    }
  };

  const testGeminiAPI = async () => {
    const key = localConfig?.integrations?.geminiKey;
    if (!key) {
      setApiTestStatus(prev => ({ ...prev, gemini: '⚠️ Lỗi: Chưa điền API Key!' }));
      return;
    }
    setApiTestStatus(prev => ({ ...prev, gemini: 'Đang kiểm tra bằng REST...' }));
    try {
      const payload = {
        contents: [{ parts: [{ text: "Say 'TEST_OK'" }] }]
      };
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.candidates) {
        setApiTestStatus(prev => ({ ...prev, gemini: '✅ KẾT NỐI THÀNH CÔNG!' }));
      } else {
        setApiTestStatus(prev => ({ ...prev, gemini: `❌ LỖI: ${data.error?.message || 'Không rõ lỗi'}` }));
      }
    } catch (err) {
      setApiTestStatus(prev => ({ ...prev, gemini: '❌ LỖI MẠNG: ' + err.message }));
    }
  };
  
  const testDeepseekAPI = async () => {
    const key = localConfig?.integrations?.deepseekKey;
    if (!key) {
      setApiTestStatus(prev => ({ ...prev, deepseek: '⚠️ Lỗi: Chưa điền API Key!' }));
      return;
    }
    setApiTestStatus(prev => ({ ...prev, deepseek: 'Đang gửi Request TCP đến Deepseek...' }));
    try {
      const payload = {
        model: "deepseek-chat",
        messages: [{ role: "user", content: "Say 'TEST_OK'" }]
      };
      // Deepseek allows standard OpenAI drop-in replacements
      const response = await fetch(`https://api.deepseek.com/chat/completions`, {
         method: 'POST',
         headers: { 
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${key}`
         },
         body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.choices) {
        setApiTestStatus(prev => ({ ...prev, deepseek: '✅ KẾT NỐI THÀNH CÔNG!' }));
      } else {
        setApiTestStatus(prev => ({ ...prev, deepseek: `❌ LỖI: ${data.error?.message || response.statusText}` }));
      }
    } catch (err) {
      setApiTestStatus(prev => ({ ...prev, deepseek: '❌ LỖI MẠNG: ' + err.message }));
    }
  };

  if (loading || !localConfig) {
    return <div className="admin-loading">INITIALIZING SYSTEM_ADMIN...</div>;
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
         alert("Ảnh quá lớn! Vui lòng chọn ảnh dưới 1MB để đảm bảo tốc độ tải hệ thống.");
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateNested('appearance', 'logoUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus('SAVING...');
    try {
      await setDoc(doc(db, 'system', 'config'), localConfig);
      setStatus('CONFIG_UPDATED_SUCCESSFULLY');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setStatus('ERROR_SAVING_CONFIG');
    } finally {
      setIsSaving(false);
    }
  };

  const updateNested = (category, field, value) => {
    setLocalConfig(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const tabs = [
    { id: 'general', label: 'CÀI ĐẶT CHUNG', icon: <Globe size={18} /> },
    { id: 'appearance', label: 'GIAO DIỆN', icon: <Palette size={18} /> },
    { id: 'content', label: 'NỘI DUNG', icon: <FileText size={18} /> },
    { id: 'integrations', label: 'TÍCH HỢP AI', icon: <Key size={18} /> },
    { id: 'users', label: 'QUẢN LÝ TÀI KHOẢN', icon: <Users size={18} /> }
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar shadow-glow">
        <div className="admin-brand">
          <Bot className="text-glow" />
          <span>BCT_ADMIN_SHELL</span>
        </div>
        
        <nav className="admin-nav">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
          
          <div className="admin-divider" style={{ margin: '1rem 0' }}></div>
          
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', color: 'var(--text-muted)', textDecoration: 'none', borderRadius: '8px', transition: 'all 0.3s' }} onMouseOver={(e) => {e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}} onMouseOut={(e) => {e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'}}>
            <Home size={18} />
            <span>VỀ TRANG CHỦ</span>
          </Link>
        </nav>

        <div className="admin-footer-btn">
          <button className="save-btn" onClick={handleSave} disabled={isSaving}>
            <Save size={18} />
            <span>{isSaving ? 'ĐANG LƯU...' : 'LƯU CẤU HÌNH'}</span>
          </button>
          {status && <div className="status-toast">{status}</div>}
        </div>
      </div>

      <main className="admin-content">
        <header className="admin-header">
          <h1>{tabs.find(t => t.id === activeTab)?.label}</h1>
          <p>Thiết lập các thông số cơ bản cho hệ thống BCT0902.</p>
        </header>

        <div className="admin-frame glass-panel">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && (
              <motion.div 
                key="general" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="config-section"
              >
                <div className="input-group">
                  <label>LOGO WEBSITE</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                     <input 
                       type="text" 
                       value={localConfig.appearance.logoUrl} 
                       onChange={(e) => updateNested('appearance', 'logoUrl', e.target.value)}
                       placeholder="URL Logo hoặc tải lên từ máy..."
                       style={{ flex: 1 }}
                     />
                     <label className="btn-secondary" style={{ cursor: 'pointer', padding: '0.8rem 1.5rem', whiteSpace: 'nowrap' }}>
                        TẢI LÊN ẢNH
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                     </label>
                  </div>
                  <small>Kích thước khuyên dùng: 200x200px. Hỗ trợ PNG/SVG (Tối đa 1MB).</small>
                </div>

                <div className="admin-divider" style={{ margin: '2rem 0' }}></div>

                <div className="apps-manager">
                  <div className="manager-header">
                    <label>QUẢN LÝ MẠNG XÃ HỘI (SOCIALS)</label>
                    <button className="add-btn" onClick={() => {
                       const newSocials = [...(localConfig.social_links || [])];
                       newSocials.push({ name: 'Mới', icon: 'Globe', url: '', color: '#0084FF', isVisible: true });
                       setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                    }}>
                      <Plus size={14} /> THÊM MXH
                    </button>
                  </div>
                  <div className="apps-table" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(localConfig.social_links || []).map((social, idx) => (
                      <div key={idx} className="app-edit-row" style={{ display: 'grid', gridTemplateColumns: 'auto 200px 150px 1fr auto auto', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={social.isVisible !== false} 
                          onChange={(e) => {
                            const newSocials = [...localConfig.social_links];
                            newSocials[idx].isVisible = e.target.checked;
                            setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                          }} 
                          title="Trạng thái Ẩn/Hiện"
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-main)' }}
                        />
                        <input 
                          type="text" 
                          placeholder="Tên (VD: Facebook)" 
                          value={social.name} 
                          onChange={(e) => {
                            const newSocials = [...localConfig.social_links];
                            newSocials[idx].name = e.target.value;
                            setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                          }} 
                        />
                        <select 
                          value={social.icon} 
                          onChange={(e) => {
                            const newSocials = [...localConfig.social_links];
                            newSocials[idx].icon = e.target.value;
                            setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                          }} 
                          style={{ background: 'var(--bg-primary)', color: '#fff', border: '1px solid var(--bg-glass-border)', padding: '0.5rem', borderRadius: '4px', outline: 'none' }}
                        >
                           <option value="Facebook">Facebook (Logo)</option>
                           <option value="Github">Github (Logo)</option>
                           <option value="LinkedIn">LinkedIn (Logo)</option>
                           <option value="Youtube">Youtube (Logo)</option>
                           <option value="MessageSquare">Messenger (Chat)</option>
                           <option value="Instagram">Instagram (Logo)</option>
                           <option value="Twitter">Twitter / X</option>
                           <option value="Globe">Khác (Trái Đất)</option>
                        </select>
                        <input 
                          type="text" 
                          placeholder="Link liên kết URL" 
                          value={social.url} 
                          onChange={(e) => {
                            const newSocials = [...localConfig.social_links];
                            newSocials[idx].url = e.target.value;
                            setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                          }} 
                        />
                        <div className="color-input-wrapper" style={{ padding: 0, border: 'none', background: 'transparent' }}>
                          <input 
                            type="color" 
                            title="Màu sắc nhận diện"
                            value={social.color} 
                            onChange={(e) => {
                              const newSocials = [...localConfig.social_links];
                              newSocials[idx].color = e.target.value;
                              setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                            }} 
                            style={{ margin: 0 }}
                          />
                        </div>
                        <button className="delete-row-btn" onClick={() => {
                          const newSocials = localConfig.social_links.filter((_, i) => i !== idx);
                          setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                        }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div 
                key="appearance" 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="config-section"
              >
                <div className="color-config-card">
                  <h3>TÙY CHỈNH MÀU SẮC CHỦ ĐẠO</h3>
                  <div className="color-picker-grid">
                    <div className="input-group">
                      <label>MÀU CHÍNH (PRIMARY)</label>
                      <div className="color-input-wrapper">
                        <input type="color" value={localConfig.appearance.primaryColor} onChange={(e) => updateNested('appearance', 'primaryColor', e.target.value)} />
                        <code>{localConfig.appearance.primaryColor}</code>
                      </div>
                    </div>
                    <div className="input-group">
                      <label>MÀU NHẤN (ACCENT)</label>
                      <div className="color-input-wrapper">
                        <input type="color" value={localConfig.appearance.accentColor} onChange={(e) => updateNested('appearance', 'accentColor', e.target.value)} />
                        <code>{localConfig.appearance.accentColor}</code>
                      </div>
                    </div>
                  </div>
                  <div className="theme-preview" style={{ background: `linear-gradient(45deg, ${localConfig.appearance.primaryColor}22, transparent)` }}>
                    <div className="preview-element" style={{ background: localConfig.appearance.primaryColor, boxShadow: `0 0 15px ${localConfig.appearance.primaryColor}` }}>PREVIEW</div>
                    <p>Web của bạn sẽ tỏa sáng với tông màu này.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'integrations' && (
              <motion.div 
                key="integrations" 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="config-section"
              >
                <div className="api-config-alert">
                  <strong>CHUYÊN MỤC API KEY:</strong> Đoạn Script Kiểm tra API đã được tối ưu để tránh lỗi CORS từ Trình duyệt. Hãy dán Key thật khớp!
                </div>
                
                <div className="input-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>GEMINI API KEY (GOOGLE)</span>
                    {apiTestStatus.gemini && (
                       <span style={{ fontSize: '0.8rem', color: apiTestStatus.gemini.includes('LỖI') ? '#ef4444' : '#10b981' }}>{apiTestStatus.gemini}</span>
                    )}
                  </label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input style={{ flex: 1 }} type="password" value={localConfig.integrations.geminiKey} onChange={(e) => updateNested('integrations', 'geminiKey', e.target.value)} placeholder="AIza..." />
                    <button onClick={testGeminiAPI} style={{ background: 'var(--bg-primary)', border: '1px solid var(--accent-main)', color: 'var(--accent-main)', padding: '0 1.5rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <Activity size={16} /> TEST GEMINI
                    </button>
                  </div>
                </div>
                
                <div className="input-group" style={{ marginTop: '1.5rem' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>DEEPSEEK API KEY</span>
                    {apiTestStatus.deepseek && (
                       <span style={{ fontSize: '0.8rem', color: apiTestStatus.deepseek.includes('LỖI') ? '#ef4444' : '#10b981' }}>{apiTestStatus.deepseek}</span>
                    )}
                  </label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input style={{ flex: 1 }} type="password" value={localConfig.integrations.deepseekKey} onChange={(e) => updateNested('integrations', 'deepseekKey', e.target.value)} placeholder="sk-..." />
                    <button onClick={testDeepseekAPI} style={{ background: 'var(--bg-primary)', border: '1px solid var(--accent-main)', color: 'var(--accent-main)', padding: '0 1.5rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <Activity size={16} /> TEST DEEPSEEK
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div 
                key="users" 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="config-section"
              >
                <div className="manager-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                   <label>CƠ SỞ DỮ LIỆU NGƯỜI DÙNG</label>
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="add-btn" onClick={() => setUserModal({ isOpen: true, mode: 'add', data: { role: 'user' } })}>
                         <Plus size={14} /> THÊM MỚI
                      </button>
                      <button className="add-btn" onClick={fetchUsers} disabled={loadingUsers}>
                         {loadingUsers ? 'ĐANG TẢI...' : 'LÀM MỚI DANH SÁCH'}
                      </button>
                   </div>
                </div>
                
                <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                   <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                         <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <th style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Avatar</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Email</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>User Details</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Role</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}>Hành động</th>
                         </tr>
                      </thead>
                      <tbody>
                         {usersList.length === 0 ? (
                           <tr>
                              <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Mảng dữ liệu Users trống.</td>
                           </tr>
                         ) : (
                           usersList.map(user => (
                              <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                 <td style={{ padding: '1rem' }}>
                                    <img src={user.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${user.email}`} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff' }} />
                                 </td>
                                 <td style={{ padding: '1rem' }}>{user.email || 'N/A'}</td>
                                 <td style={{ padding: '1rem' }}>
                                    {user.displayName || (user.firstName ? `${user.lastName || ''} ${user.firstName}` : '(Chưa đặt tên)')}
                                    <br/>
                                    <small style={{ color: 'var(--text-muted)' }}>@{user.username || 'unknown'}</small>
                                 </td>
                                 <td style={{ padding: '1rem' }}>
                                    <span style={{ 
                                       padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                       background: user.role === 'admin' ? 'rgba(var(--accent-rgb), 0.2)' : 'rgba(255,255,255,0.1)',
                                       color: user.role === 'admin' ? 'var(--accent-main)' : 'var(--text-muted)'
                                    }}>
                                       {user.role?.toUpperCase() || 'USER'}
                                    </span>
                                 </td>
                                 <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    <button style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.5rem' }} onClick={() => setUserModal({ isOpen: true, mode: 'edit', data: user })} title="Sửa thông tin hồ sơ">
                                       <Edit size={16} />
                                    </button>
                                    <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }} onClick={() => deleteUserRecord(user.id)} title="Xóa sơ yếu lý lịch này">
                                       <Trash2 size={16} />
                                    </button>
                                 </td>
                              </tr>
                           ))
                         )}
                      </tbody>
                   </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'content' && (
              <motion.div 
                key="content" 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="config-section"
              >
                <div className="input-group">
                  <label>LỜI CHÀO BCT ENGINE (AI CHAT)</label>
                  <textarea 
                    value={localConfig.content.welcomeMessage} 
                    onChange={(e) => updateNested('content', 'welcomeMessage', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="admin-divider"></div>

                <div className="quotes-manager">
                  <label>10 CÂU NÓI HỒ CHÍ MINH</label>
                  <div className="quotes-list">
                    {localConfig.content.quotes.map((quote, idx) => (
                      <div key={idx} className="quote-item">
                        <span>{idx + 1}.</span>
                        <input 
                          type="text" 
                          value={quote} 
                          onChange={(e) => {
                            const newQuotes = [...localConfig.content.quotes];
                            newQuotes[idx] = e.target.value;
                            updateNested('content', 'quotes', newQuotes);
                          }} 
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-divider"></div>

                <div className="film-manager">
                  <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                    <label>TỐC ĐỘ CUỘN PHIM (GIÂY)</label>
                    <input 
                      type="number" 
                      value={localConfig.content.filmStripSpeed || 45} 
                      onChange={(e) => updateNested('content', 'filmStripSpeed', Number(e.target.value))}
                      placeholder="45"
                      min="10"
                      max="120"
                    />
                  </div>
                  <div className="manager-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <label>HÌNH ẢNH DẢI PHIM (FILM STRIP)</label>
                    <button className="add-btn" onClick={() => {
                       const newFilms = [...(localConfig.content.filmStripImages || [])];
                       newFilms.push('/placeholder.png');
                       updateNested('content', 'filmStripImages', newFilms);
                    }}>
                      <Plus size={14} /> THÊM ẢNH
                    </button>
                  </div>
                  <div className="film-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(localConfig.content.filmStripImages || []).map((imgUrl, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          value={imgUrl} 
                          placeholder="URL ảnh (/film/... hoặc https://...)"
                          style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--bg-glass-border)', color: 'var(--text-primary)', borderRadius: '4px' }}
                          onChange={(e) => {
                            const newFilms = [...localConfig.content.filmStripImages];
                            newFilms[idx] = e.target.value;
                            updateNested('content', 'filmStripImages', newFilms);
                          }} 
                        />
                        <button style={{ padding: '0.5rem', background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px' }} onClick={() => {
                          const newFilms = localConfig.content.filmStripImages.filter((_, i) => i !== idx);
                          updateNested('content', 'filmStripImages', newFilms);
                        }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-divider"></div>

                <div className="apps-manager">
                  <div className="manager-header">
                    <label>DANH SÁCH ỨNG DỤNG TIN DÙNG</label>
                    <button className="add-btn" onClick={() => {
                       const newApps = [...(localConfig.apps || [])];
                       newApps.push({ name: 'App Mới', color: '#ffffff', iconUrl: '' });
                       setLocalConfig(prev => ({ ...prev, apps: newApps }));
                    }}>
                      <Plus size={14} /> THÊM
                    </button>
                  </div>
                  <div className="apps-table">
                    {(localConfig.apps || []).map((app, idx) => (
                      <div key={idx} className="app-edit-row">
                        <input 
                          type="text" 
                          placeholder="Tên App"
                          value={app.name} 
                          onChange={(e) => {
                            const newApps = [...localConfig.apps];
                            newApps[idx].name = e.target.value;
                            setLocalConfig(prev => ({ ...prev, apps: newApps }));
                          }}
                        />
                        <input 
                          type="color" 
                          value={app.color} 
                          onChange={(e) => {
                            const newApps = [...localConfig.apps];
                            newApps[idx].color = e.target.value;
                            setLocalConfig(prev => ({ ...prev, apps: newApps }));
                          }}
                        />
                        <input 
                          type="text" 
                          placeholder="URL Icon (png/svg)"
                          value={app.iconUrl} 
                          onChange={(e) => {
                            const newApps = [...localConfig.apps];
                            newApps[idx].iconUrl = e.target.value;
                            setLocalConfig(prev => ({ ...prev, apps: newApps }));
                          }}
                        />
                        <button className="delete-row-btn" onClick={() => {
                          const newApps = localConfig.apps.filter((_, i) => i !== idx);
                          setLocalConfig(prev => ({ ...prev, apps: newApps }));
                        }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* MODAL USER CRUD */}
      {userModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
           <div style={{ background: '#111', width: '90%', maxWidth: '500px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', position: 'relative' }}>
              <button 
                 onClick={() => setUserModal({ isOpen: false, mode: 'add', data: {} })} 
                 style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                  <X size={20} />
              </button>
              
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-gold)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                 {userModal.mode === 'add' ? 'THÊM MỚI' : 'CHỈNH SỬA'} HỒ SƠ
              </h2>

              <form onSubmit={saveUserRecord} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="input-group" style={{ flex: 1 }}>
                       <label>TÊN THẬT (DISPLAY NAME)</label>
                       <input 
                          type="text" 
                          value={userModal.data.displayName || ''} 
                          onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, displayName: e.target.value } })}
                          required
                          style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}
                       />
                    </div>
                    <div className="input-group" style={{ width: '120px' }}>
                       <label>PHÂN QUYỀN</label>
                       <select 
                          value={userModal.data.role || 'user'} 
                          onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, role: e.target.value } })}
                          style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}
                       >
                          <option value="user">USER</option>
                          <option value="admin">ADMIN</option>
                       </select>
                    </div>
                 </div>

                 <div className="input-group">
                    <label>LIÊN KẾT EMAIL</label>
                    <input 
                       type="email" 
                       value={userModal.data.email || ''} 
                       onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, email: e.target.value } })}
                       readOnly={userModal.mode === 'edit' && userModal.data.email === 'buicongtoi01@gmail.com'}
                       required
                       style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}
                    />
                 </div>

                 <div className="input-group">
                    <label>USERNAME TÙY CHỌN</label>
                    <input 
                       type="text" 
                       value={userModal.data.username || ''} 
                       onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, username: e.target.value } })}
                       style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}
                    />
                 </div>

                 <div className="input-group">
                    <label>ĐƯỜNG DẪN AVATAR (Mặc định tự gen Nếu Trống)</label>
                    <input 
                       type="text" 
                       value={userModal.data.photoURL || ''} 
                       onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, photoURL: e.target.value } })}
                       style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}
                    />
                 </div>

                 <button type="submit" className="save-btn" style={{ width: '100%', padding: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
                    <Save size={18} />
                    <span>LƯU HỒ SƠ</span>
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
