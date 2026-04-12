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
  Bot
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { useConfig } from '../../context/ConfigContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { config, loading } = useConfig();
  const [activeTab, setActiveTab] = useState('general');
  const [localConfig, setLocalConfig] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (config) {
      setLocalConfig(JSON.parse(JSON.stringify(config)));
    }
  }, [config]);

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
    { id: 'integrations', label: 'TÍCH HỢP AI', icon: <Key size={18} /> },
    { id: 'content', label: 'NỘI DUNG', icon: <FileText size={18} /> }
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
          <h1>{tabs.find(t => t.id === activeTab).label}</h1>
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
                  <strong>CHÚ Ý:</strong> Các API Key cấu hình ở đây sẽ được ưu tiên sử dụng thay cho API Key trong file .env.
                </div>
                
                <div className="input-group">
                  <label>GEMINI API KEY (GOOGLE)</label>
                  <input type="password" value={localConfig.integrations.geminiKey} onChange={(e) => updateNested('integrations', 'geminiKey', e.target.value)} placeholder="AIza..." />
                </div>
                
                <div className="input-group">
                  <label>DEEPSEEK API KEY</label>
                  <input type="password" value={localConfig.integrations.deepseekKey} onChange={(e) => updateNested('integrations', 'deepseekKey', e.target.value)} placeholder="sk-..." />
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
    </div>
  );
};

export default AdminDashboard;
