import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Trash2, 
  PlusCircle, 
  Bot, 
  User, 
  Zap, 
  Cpu, 
  Copy, 
  Check,
  ChevronLeft,
  Settings,
  Sparkles,
  MessageSquare,
  History,
  Terminal,
  Eraser,
  Shield,
  ChevronDown,
  Brain
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, prism as oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { db, auth } from '../firebase';
import { useTheme } from '../hooks/useTheme';
import { collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useConfig } from '../context/ConfigContext';
import AIModelPills from '../components/AIModelPills';
import './AIChat.css';

const AIChat = () => {
  const { config } = useConfig();
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepThink, setIsDeepThink] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('groq');
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  
  const messagesEndRef = useRef(null);
  const { currentUser: authUser, isAdmin } = useAuth();
  const currentUser = authUser;
  const navigate = useNavigate();

  // AI Config
  const geminiKey = config?.integrations?.geminiKey || import.meta.env.VITE_GEMINI_API_KEY;
  const deepseekKey = config?.integrations?.deepseekKey || import.meta.env.VITE_DEEPSEEK_API_KEY;
  const groqKey = config?.integrations?.groqKey;

  const genAI = new GoogleGenerativeAI(geminiKey || 'dummy_key');
  const groq = groqKey ? new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1', dangerouslyAllowBrowser: true }) : null;
  const deepseek = new OpenAI({ apiKey: deepseekKey || 'dummy_key', baseURL: 'https://api.deepseek.com', dangerouslyAllowBrowser: true });

  const getUserDisplayName = () => {
    if (currentUser?.displayName) return currentUser.displayName;
    if (currentUser?.email) return currentUser.email.split('@')[0];
    return 'Bạn';
  };

  const scrollToBottom = () => {
     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Firebase Effects
  useEffect(() => {
    if (!currentUser && !isAdmin) return;
    const uid = currentUser?.uid || 'admin';
    const chatsRef = collection(db, 'users', uid, 'chats');
    const q = query(chatsRef, orderBy('lastUpdate', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChatHistory(chats);
      if (!activeChatId && chats.length > 0) setActiveChatId(chats[0].id);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !activeChatId) return;
    const msgsRef = collection(db, 'users', currentUser.uid, 'chats', activeChatId, 'messages');
    const q = query(msgsRef, orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data());
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [currentUser, activeChatId]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = { role: 'user', content: input, timestamp: serverTimestamp() };
    const tempInput = input;
    setInput('');
    setIsLoading(true);

    if (currentUser && activeChatId) {
      await addDoc(collection(db, 'users', currentUser.uid, 'chats', activeChatId, 'messages'), userMsg);
    } else {
      setMessages(prev => [...prev, userMsg]);
    }

    try {
      let aiResponseContent = '';
      let imageUrl = '';
      let displayPrompt = tempInput;
      
      if (isDeepThink) {
        displayPrompt = `[DEEP THINK MODE - Hãy phân tích sâu và tìm kiếm thông tin mới nhất] ${tempInput}`;
      }

      if (isImageMode) {
        // IMAGE GENERATION SIMULATION (IRIS Visual Studio)
        await new Promise(r => setTimeout(r, 2000)); // Simulate GPU processing
        imageUrl = '/iris_visual_studio_demo_1776002252586.png';
        aiResponseContent = `🎨 **IRIS Visual Studio**\n\nHình ảnh đã được tạo dựa trên mô tả: "${tempInput}"\n\n![IRIS AI Generated Image](${imageUrl})`;
      } else {
        // INJECT REAL-TIME CONTEXT & GROUNDING TOOLS
        const now = new Date();
        const timeStr = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        const contextPrompt = `[Hệ thống: Bạn là IRIS, trợ lý AI thông minh có khả năng truy cập web thời gian thực. Giờ hệ thống: ${timeStr}. Nếu người dùng hỏi về tin tức, thời gian, hoặc sự kiện mới nhất, hãy sử dụng công cụ tìm kiếm của bạn để trả lời chính xác nhất.] ${displayPrompt}`;

        if (selectedModel === 'gemini') {
          // MULTI-MODEL AUTO-FALLBACK LOOP
          const testConfigs = [
            // Preferred: v1beta with Search Grounding
            { 
              ver: 'v1beta', 
              model: 'gemini-flash-latest',
              payload: { 
                contents: [{ parts: [{ text: contextPrompt }] }],
                tools: [{ google_search_retrieval: { dynamic_retrieval_config: { mode: "DYNAMIC", dynamic_threshold: 0.1 } } }]
              }
            },
            // Fallback 1: v1beta pro latest
            { 
              ver: 'v1beta', 
              model: 'gemini-pro-latest',
              payload: { 
                contents: [{ parts: [{ text: contextPrompt }] }],
                tools: [{ google_search_retrieval: { dynamic_retrieval_config: { mode: "DYNAMIC", dynamic_threshold: 0.1 } } }]
              }
            },
            // Fallback 2: v1beta without grounding
            { 
              ver: 'v1beta', 
              model: 'gemini-flash-latest',
              payload: { contents: [{ parts: [{ text: contextPrompt }] }] }
            },
            // Fallback 3: stable v1
            { 
              ver: 'v1', 
              model: 'gemini-1.5-flash',
              payload: { contents: [{ parts: [{ text: contextPrompt }] }] }
            }
          ];

          let success = false;
          for (const config of testConfigs) {
            try {
              const response = await fetch(`https://generativelanguage.googleapis.com/${config.ver}/models/${config.model}:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config.payload)
              });
              const data = await response.json();
              
              if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
                aiResponseContent = data.candidates[0].content.parts[0].text;
                success = true;
                break;
              }
            } catch (e) {
              console.warn(`Retry loop: ${config.ver}/${config.model} failed, trying next...`);
            }
          }

          if (!success) aiResponseContent = "❌ Lỗi: Hệ thống không thể kết nối với bất kỳ Model Gemini nào. Vui lòng kiểm tra API Key trong Dashboard.";
        } else if (selectedModel === 'groq') {
          const completion = await groq.chat.completions.create({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: contextPrompt }] });
          aiResponseContent = completion.choices[0].message.content;
        } else {
          const completion = await deepseek.chat.completions.create({ model: "deepseek-chat", messages: [{ role: "user", content: contextPrompt }] });
          aiResponseContent = completion.choices[0].message.content;
        }
      }

      const aiMsg = { 
        role: 'assistant', 
        content: aiResponseContent, 
        imageUrl: imageUrl, // Save separate URL if needed for UI optimizations
        timestamp: serverTimestamp() 
      };
      
      if (currentUser && activeChatId) {
        await addDoc(collection(db, 'users', currentUser.uid, 'chats', activeChatId, 'messages'), aiMsg);
        await updateDoc(doc(db, 'users', currentUser.uid, 'chats', activeChatId), { lastUpdate: serverTimestamp() });
      } else {
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsImageMode(false); // Reset after action if used as toggle
    }
  };

  const generateImage = async () => {
    if (!input.trim() || isLoading) return;
    setIsImageMode(true);
    await handleSend();
  };

  return (
    <div className="ai-chat-container">
      {/* Sidebar - Floating rounded glass */}
      <aside className={`chat-sidebar ${isSidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>HỘI THOẠI</h2>
          <button className="toggle-sidebar" onClick={() => setIsSidebarOpen(false)}><ChevronLeft /></button>
        </div>

        <button className="new-chat-btn" onClick={() => navigate('/utilities/chat')}>
          <PlusCircle size={20} />
          BẮT ĐẦU CHAT MỚI
        </button>

        <div className="chat-history-list">
          {chatHistory.map(chat => (
            <div key={chat.id} className={`history-item ${activeChatId === chat.id ? 'active' : ''}`} onClick={() => setActiveChatId(chat.id)}>
              <MessageSquare size={16} />
              <div className="chat-title">{chat.title}</div>
            </div>
          ))}
        </div>

        <div className="sidebar-footer" style={{ padding: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
           <button onClick={() => navigate('/admin')} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: 'none', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
             <Shield size={16} /> DASHBOARD
           </button>
        </div>
      </aside>

      {/* Main interface */}
      <main className="main-chat-area">
        {!isSidebarOpen && (
          <button className="toggle-sidebar" style={{ position: 'absolute', left: 0, top: '1rem', zIndex: 100 }} onClick={() => setIsSidebarOpen(true)}>
             <Terminal size={20} />
          </button>
        )}

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <h1 className="welcome-greeting" style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '3.5rem', gap: '1.5rem', marginBottom: '1rem' }}>
                👋 Hi {getUserDisplayName()}, mình là IRIS
              </h1>
              <h2 style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '1.8rem', color: '#555', fontWeight: 500, marginBottom: '3rem', opacity: 0.8 }}>
                Mình có thể giúp gì cho bạn ?
              </h2>
            </div>
          ) : (
            messages.map((msg, index) => (
              <motion.div key={index} className={`message-wrapper ${msg.role}`}>
                <div className="message-avatar">
                   {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className="message-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* IRIS Input Center */}
        <div className="iris-input-area">
          <div className={`iris-input-card ${isFocused ? 'focused' : ''}`}>
             <textarea 
               className="iris-textarea"
               placeholder={isImageMode ? "Mô tả hình ảnh bạn muốn tạo..." : "Nhập câu hỏi tại đây..."}
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
               onFocus={() => setIsFocused(true)}
               onBlur={() => setIsFocused(false)}
               rows={1}
               style={{ color: '#1a1a1a' }}
             />
             
             <div className="iris-input-actions">
                <div className="action-left">
                   <div className="model-dropdown-wrapper">
                      <button 
                        className={`action-chip model-selector-btn ${selectedModel}`} 
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        style={{ 
                          background: selectedModel === 'gemini' ? '#4285F4' : (selectedModel === 'groq' ? '#F4511E' : '#673AB7'),
                          color: '#fff',
                          fontWeight: 'bold',
                          boxShadow: `0 0 15px ${selectedModel === 'gemini' ? 'rgba(66, 133, 244, 0.4)' : (selectedModel === 'groq' ? 'rgba(244, 81, 30, 0.4)' : 'rgba(103, 58, 183, 0.4)')}`
                        }}
                      >
                         <Cpu size={16} /> {selectedModel.toUpperCase()} <ChevronDown size={14} />
                      </button>
                      
                      {isModelDropdownOpen && (
                         <div className="model-dropdown-menu">
                            {['gemini', 'deepseek', 'groq'].map(m => (
                               <div key={m} className={`dropdown-item ${selectedModel === m ? 'active' : ''}`} onClick={() => { setSelectedModel(m); setIsModelDropdownOpen(false); }}>
                                  {m === 'gemini' && <Sparkles size={14} color="#4285F4" />}
                                  {m === 'deepseek' && <Brain size={14} color="#673AB7" />}
                                  {m === 'groq' && <Zap size={14} color="#F4511E" />}
                                  {m.toUpperCase()}
                               </div>
                            ))}
                         </div>
                      )}
                   </div>

                    <div 
                       className={`action-chip ${isDeepThink ? 'active' : ''}`}
                       onClick={() => setIsDeepThink(!isDeepThink)}
                    >
                      <Zap size={16} /> DeepThink
                    </div>
                    
                    <button 
                       className="action-chip ai-image"
                       onClick={generateImage}
                       disabled={isLoading || !input.trim()}
                       style={{ border: '1px solid #ff00c866', background: 'rgba(255, 0, 200, 0.05)' }}
                    >
                      <Sparkles size={16} color="#ff00c8" /> IRIS Visual Studio
                    </button>
                 </div>

                <button 
                  className="iris-send-btn"
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                >
                  <Send size={20} />
                </button>
             </div>
          </div>
          {/* Dedicated glow layer sibling to prevent stacking context leaks */}
          <div className="iris-glow-layer" />
        </div>
      </main>
    </div>
  );
};

export default AIChat;
