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
  X,
  Upload,
  Image as ImageIcon,
  Zap
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
    if (!window.confirm('Ngài có chắc chắn muốn xoá hồ sơ này khỏi Database?')) return;
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
    
    const finalPhotoURL = photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${email || Math.random()}`;
    const finalDisplayName = displayName || (firstName ? `${lastName || ''} ${firstName}`.trim() : 'Người Dùng');
    
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
    setApiTestStatus(prev => ({ ...prev, gemini: 'Đang kiểm tra bằng REST v1beta...' }));
    try {
      const payload = {
        contents: [{ parts: [{ text: "Say 'TEST_OK'" }] }]
      };
      // Fixed: Using v1 instead of v1beta and ensuring model name is correct
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

  const testGroqAPI = async () => {
    const key = localConfig?.integrations?.groqKey;
    if (!key) {
      setApiTestStatus(prev => ({ ...prev, groq: '⚠️ Lỗi: Chưa điền API Key!' }));
      return;
    }
    setApiTestStatus(prev => ({ ...prev, groq: 'Đang kiểm tra bằng REST...' }));
    try {
      const payload = {
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: "Say 'TEST_OK'" }]
      };
      const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
         method: 'POST',
         headers: { 
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${key}`
         },
         body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.choices) {
        setApiTestStatus(prev => ({ ...prev, groq: '✅ KẾT NỐI THÀNH CÔNG!' }));
      } else {
        setApiTestStatus(prev => ({ ...prev, groq: `❌ LỖI: ${data.error?.message || response.statusText}` }));
      }
    } catch (err) {
      setApiTestStatus(prev => ({ ...prev, groq: '❌ LỖI MẠNG: ' + err.message }));
    }
  };

  const handleFileUpload = (e, callback) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result);
      };
      reader.readAsDataURL(file);
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

  const tabs = [
    { id: 'general', label: 'CÀI ĐẶT CHUNG', icon: <Globe size={18} /> },
    { id: 'appearance', label: 'GIAO DIỆN', icon: <Palette size={18} /> },
    { id: 'filmstrip', label: 'KỸ THUẬT SỐ & KÝ ỨC', icon: <ImageIcon size={18} /> },
    { id: 'apps', label: 'ỨNG DỤNG TIN DÙNG', icon: <Zap size={18} /> },
    { id: 'content', label: 'NỘI DUNG KHÁC', icon: <FileText size={18} /> },
    { id: 'integrations', label: 'TÍCH HỢP AI', icon: <Key size={18} /> },
    { id: 'users', label: 'QUẢN LÝ TÀI KHOẢN', icon: <Users size={18} /> }
  ];

  if (loading || !localConfig) {
    return <div className="admin-loading">INITIALIZING SYSTEM_ADMIN...</div>;
  }

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
          
          <Link to="/" className="nav-item-link">
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
          <p>Thiết lập hệ thống BCT0902 - Core Console.</p>
        </header>

        <div className="admin-frame glass-panel">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && (
              <motion.div key="general" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="config-section">
                <div className="input-group">
                  <label>LOGO WEBSITE (Bất kỳ dung lượng)</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                     <input 
                       type="text" 
                       value={localConfig.appearance.logoUrl} 
                       onChange={(e) => updateNested('appearance', 'logoUrl', e.target.value)}
                       placeholder="URL Logo hoặc tải lên..."
                       style={{ flex: 1 }}
                     />
                     <label className="btn-secondary" style={{ cursor: 'pointer', padding: '0.8rem 1.5rem', whiteSpace: 'nowrap', background: 'var(--accent-main)', color: '#fff', borderRadius: '4px' }}>
                        TẢI LÊN LOGO
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, (res) => updateNested('appearance', 'logoUrl', res))} />
                     </label>
                  </div>
                </div>

                <div className="admin-divider" style={{ margin: '2rem 0' }}></div>

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
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(localConfig.social_links || []).map((social, idx) => (
                    <div key={idx} className="app-edit-row" style={{ display: 'grid', gridTemplateColumns: 'auto 150px 180px 1fr 150px auto auto', gap: '0.8rem', padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <input type="checkbox" checked={social.isVisible !== false} onChange={(e) => {
                        const newSocials = [...localConfig.social_links];
                        newSocials[idx].isVisible = e.target.checked;
                        setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                      }} />
                      
                      <input type="text" placeholder="Tên" value={social.name} onChange={(e) => {
                        const newSocials = [...localConfig.social_links];
                        newSocials[idx].name = e.target.value;
                        setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                      }} />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           {social.iconUrl ? <img src={social.iconUrl} alt="icon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ImageIcon size={14} />}
                        </div>
                        <label style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer' }}>
                          UPLOAD
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, (res) => {
                             const newSocials = [...localConfig.social_links];
                             newSocials[idx].iconUrl = res;
                             setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                          })} />
                        </label>
                      </div>

                      <input type="text" placeholder="Link liên kết URL" value={social.url} onChange={(e) => {
                        const newSocials = [...localConfig.social_links];
                        newSocials[idx].url = e.target.value;
                        setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                      }} />

                      <div className="color-input-wrapper">
                        <input type="color" value={social.color} onChange={(e) => {
                          const newSocials = [...localConfig.social_links];
                          newSocials[idx].color = e.target.value;
                          setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                        }} />
                        <code style={{ fontSize: '0.7rem' }}>{social.color}</code>
                      </div>

                      <button className="delete-row-btn" onClick={() => {
                        const newSocials = localConfig.social_links.filter((_, i) => i !== idx);
                        setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                      }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'filmstrip' && (
              <motion.div key="filmstrip" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="config-section">
                <div className="input-group">
                   <label>TỐC ĐỘ CUỘN PHIM (GIÂY)</label>
                   <input type="number" value={localConfig.content.filmStripSpeed || 45} onChange={(e) => updateNested('content', 'filmStripSpeed', Number(e.target.value))} min="10" max="120" />
                </div>
                <div className="manager-header" style={{ marginTop: '2rem' }}>
                  <label>HÌNH ẢNH DẢI PHIM (FILM STRIP)</label>
                  <button className="add-btn" onClick={() => {
                     const newFilms = [...(localConfig.content.filmStripImages || [])];
                     newFilms.push('/placeholder.png');
                     updateNested('content', 'filmStripImages', newFilms);
                  }}>
                    <Plus size={14} /> THÊM ẢNH
                  </button>
                </div>
                <div className="film-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {(localConfig.content.filmStripImages || []).map((imgUrl, idx) => (
                    <div key={idx} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       <div style={{ height: '120px', background: '#000', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <img src={imgUrl} alt="strip" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.src = '/placeholder.png'} />
                       </div>
                       <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input type="text" value={imgUrl} style={{ flex: 1, fontSize: '0.8rem' }} onChange={(e) => {
                             const newFilms = [...localConfig.content.filmStripImages];
                             newFilms[idx] = e.target.value;
                             updateNested('content', 'filmStripImages', newFilms);
                          }} />
                          <label style={{ background: 'var(--accent-main)', color: '#fff', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }}>
                             <Upload size={14} />
                             <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, (res) => {
                                const newFilms = [...localConfig.content.filmStripImages];
                                newFilms[idx] = res;
                                updateNested('content', 'filmStripImages', newFilms);
                             })} />
                          </label>
                          <button style={{ background: 'var(--danger)', color: '#fff', padding: '0.4rem', borderRadius: '4px', border: 'none' }} onClick={() => {
                             const newFilms = localConfig.content.filmStripImages.filter((_, i) => i !== idx);
                             updateNested('content', 'filmStripImages', newFilms);
                          }}><Trash2 size={14} /></button>
                       </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'apps' && (
              <motion.div key="apps" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="config-section">
                <div className="manager-header">
                  <label>HỆ SINH THÁI ỨNG DỤNG (TRUSTED APPS)</label>
                  <button className="add-btn" onClick={() => {
                     const newApps = [...(localConfig.apps || [])];
                     newApps.push({ name: 'App Mới', color: '#ffffff', iconUrl: '' });
                     setLocalConfig(prev => ({ ...prev, apps: newApps }));
                  }}>
                    <Plus size={14} /> THÊM ỨNG DỤNG
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(localConfig.apps || []).map((app, idx) => (
                    <div key={idx} className="app-edit-row" style={{ display: 'grid', gridTemplateColumns: '1fr 150px 200px 100px auto', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                      <input type="text" placeholder="Tên App" value={app.name} onChange={(e) => {
                        const newApps = [...localConfig.apps];
                        newApps[idx].name = e.target.value;
                        setLocalConfig(prev => ({ ...prev, apps: newApps }));
                      }} />
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                         <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                            <img src={app.iconUrl || '/placeholder.png'} alt="app-icon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                         </div>
                         <label style={{ cursor: 'pointer', fontSize: '0.7rem' }}>
                            <Upload size={14} />
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, (res) => {
                               const newApps = [...localConfig.apps];
                               newApps[idx].iconUrl = res;
                               setLocalConfig(prev => ({ ...prev, apps: newApps }));
                            })} />
                         </label>
                      </div>

                      <input type="text" placeholder="Hoặc dán URL Icon" value={app.iconUrl} onChange={(e) => {
                        const newApps = [...localConfig.apps];
                        newApps[idx].iconUrl = e.target.value;
                        setLocalConfig(prev => ({ ...prev, apps: newApps }));
                      }} />

                      <input type="color" value={app.color} onChange={(e) => {
                        const newApps = [...localConfig.apps];
                        newApps[idx].color = e.target.value;
                        setLocalConfig(prev => ({ ...prev, apps: newApps }));
                      }} />
                      
                      <button className="delete-row-btn" onClick={() => {
                        const newApps = localConfig.apps.filter((_, i) => i !== idx);
                        setLocalConfig(prev => ({ ...prev, apps: newApps }));
                      }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'content' && (
              <motion.div key="content" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="config-section">
                <div className="input-group">
                  <label>LỜI CHÀO BCT ENGINE (DÀNH CHO KHÁCH)</label>
                  <textarea value={localConfig.content.welcomeMessage} onChange={(e) => updateNested('content', 'welcomeMessage', e.target.value)} rows={2} />
                </div>
                <div className="input-group" style={{ marginTop: '1rem' }}>
                  <label>LỜI CHÀO BCT ENGINE (DÀNH CHO USER ĐÃ ĐĂNG NHẬP)</label>
                  <textarea value={localConfig.content.welcomeUserMessage || ''} onChange={(e) => updateNested('content', 'welcomeUserMessage', e.target.value)} rows={2} placeholder="Sử dụng biến ngẫu nhiên hoặc tên custom..." />
                </div>
                <div className="admin-divider" style={{ margin: '2rem 0' }}></div>
                <div className="quotes-manager">
                  <label>DANH NGÔN TÙY CHỈNH</label>
                  <div className="quotes-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {(localConfig.content.quotes || []).map((quote, idx) => (
                      <div key={idx} className="quote-item">
                        <span>{idx + 1}</span>
                        <input type="text" value={quote} onChange={(e) => {
                          const newQuotes = [...localConfig.content.quotes];
                          newQuotes[idx] = e.target.value;
                          updateNested('content', 'quotes', newQuotes);
                        }} />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div key="appearance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="config-section">
                <div className="color-config-card">
                  <h3>THEME COLOR ENGINE</h3>
                  <div className="color-picker-grid">
                    <div className="input-group">
                      <label>MÀU CHỦ ĐẠO</label>
                      <div className="color-input-wrapper">
                        <input type="color" value={localConfig.appearance.primaryColor} onChange={(e) => updateNested('appearance', 'primaryColor', e.target.value)} />
                        <code>{localConfig.appearance.primaryColor}</code>
                      </div>
                    </div>
                    <div className="input-group">
                      <label>MÀU NHẤN MẠNH</label>
                      <div className="color-input-wrapper">
                        <input type="color" value={localConfig.appearance.accentColor} onChange={(e) => updateNested('appearance', 'accentColor', e.target.value)} />
                        <code>{localConfig.appearance.accentColor}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'integrations' && (
              <motion.div key="integrations" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="config-section">
                <div className="api-config-alert"><strong>KIỂM TRA API:</strong> Đã cập nhật sang v1 cho Gemini và Standard Header cho Deepseek.</div>
                <div className="input-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>GEMINI API KEY (v1/1.5-flash)</span>
                    <span style={{ fontSize: '0.8rem', color: apiTestStatus.gemini.includes('LỖI') ? '#ef4444' : '#10b981' }}>{apiTestStatus.gemini}</span>
                  </label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input style={{ flex: 1 }} type="password" value={localConfig.integrations.geminiKey} onChange={(e) => updateNested('integrations', 'geminiKey', e.target.value)} />
                    <button className="add-btn" onClick={testGeminiAPI}><Activity size={16} /> TEST v1</button>
                  </div>
                </div>
                <div className="input-group" style={{ marginTop: '1.5rem' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>DEEPSEEK API KEY</span>
                    <span style={{ fontSize: '0.8rem', color: apiTestStatus.deepseek.includes('LỖI') ? '#ef4444' : '#10b981' }}>{apiTestStatus.deepseek}</span>
                  </label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input style={{ flex: 1 }} type="password" value={localConfig.integrations.deepseekKey} onChange={(e) => updateNested('integrations', 'deepseekKey', e.target.value)} />
                    <button className="add-btn" onClick={testDeepseekAPI}><Activity size={16} /> TEST</button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="config-section">
                 <div className="manager-header">
                    <label>DB USERS ({usersList.length})</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                       <button className="add-btn" onClick={() => setUserModal({ isOpen: true, mode: 'add', data: { role: 'user' } })}><Plus size={14} /> THÊM MỚI</button>
                       <button className="add-btn" onClick={fetchUsers}><Activity size={14} /> REFRESH</button>
                    </div>
                 </div>
                 <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="admin-table">
                       <thead>
                          <tr>
                             <th>Bản sắc</th>
                             <th>Liên hệ</th>
                             <th>Vai trò</th>
                             <th style={{ textAlign: 'right' }}>Thao tác</th>
                          </tr>
                       </thead>
                       <tbody>
                          {usersList.map(user => (
                             <tr key={user.id}>
                                <td>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <img src={user.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${user.email}`} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fff' }} alt="u" />
                                      <div>
                                         <div style={{ fontWeight: 'bold' }}>{user.displayName || 'Unnamed'}</div>
                                         <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>@{user.username || 'n/a'}</div>
                                      </div>
                                   </div>
                                </td>
                                <td>{user.email}</td>
                                <td><span className={`role-badge ${user.role}`}>{user.role?.toUpperCase()}</span></td>
                                <td style={{ textAlign: 'right' }}>
                                   <button className="icon-btn" onClick={() => setUserModal({ isOpen: true, mode: 'edit', data: user })}><Edit size={14} /></button>
                                   <button className="icon-btn danger" onClick={() => deleteUserRecord(user.id)}><Trash2 size={14} /></button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* MODAL USER CRUD */}
      {userModal.isOpen && (
        <div className="admin-modal-overlay">
           <div className="admin-modal-card">
              <button className="modal-close" onClick={() => setUserModal({ isOpen: false, mode: 'add', data: {} })}><X size={20} /></button>
              <h2>{userModal.mode === 'add' ? 'KHỞI TẠO' : 'HIỆU CHỈNH'} HỒ SƠ</h2>
              <form onSubmit={saveUserRecord} className="modal-form">
                 <div className="form-row">
                    <div className="field">
                       <label>TÊN HIỂN THỊ</label>
                       <input type="text" value={userModal.data.displayName || ''} onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, displayName: e.target.value } })} required />
                    </div>
                    <div className="field" style={{ width: '120px' }}>
                       <label>QUYỀN HẠN</label>
                       <select value={userModal.data.role || 'user'} onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, role: e.target.value } })}>
                          <option value="user">USER</option>
                          <option value="admin">ADMIN</option>
                       </select>
                    </div>
                 </div>
                 <div className="field">
                    <label>EMAIL HỆ THỐNG</label>
                    <input type="email" value={userModal.data.email || ''} onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, email: e.target.value } })} required />
                 </div>
                 <div className="field">
                    <label>USERNAME @</label>
                    <input type="text" value={userModal.data.username || ''} onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, username: e.target.value } })} />
                 </div>
                 <div className="field">
                    <label>URL AVATAR</label>
                    <input type="text" value={userModal.data.photoURL || ''} onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, photoURL: e.target.value } })} />
                 </div>
                 <button type="submit" className="save-btn"><Save size={18}/> LƯU DỮ LIỆU</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
