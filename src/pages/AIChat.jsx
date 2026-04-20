import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  PlusCircle, 
  MessageSquare, 
  LogOut, 
  ChevronLeft, 
  ArrowLeft, 
  Bot, 
  Sparkles, 
  Cpu, 
  Settings, 
  HelpCircle, 
  X, 
  Menu,
  Shield,
  Zap,
  Brain,
  Download,
  Terminal,
  User
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
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [chatMode, setChatMode] = useState('fast'); // 'fast' | 'reasoning'
  const [routingInfo, setRoutingInfo] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  
  const messagesEndRef = useRef(null);
  const { currentUser: authUser, isAdmin } = useAuth();
  const currentUser = authUser;
  const navigate = useNavigate();

  // AI Config
  // AI Config Status
  const geminiEnabled = config?.integrations?.geminiEnabled !== false;
  const groqEnabled = config?.integrations?.groqEnabled !== false;
  const tavilyEnabled = config?.integrations?.tavilyEnabled !== false;

  const geminiKey = (geminiEnabled && (config?.integrations?.geminiKey || import.meta.env.VITE_GEMINI_API_KEY)) || null;
  const groqKey = groqEnabled ? config?.integrations?.groqKey : null;
  const tavilyKey = tavilyEnabled ? config?.integrations?.tavilyKey : null;

  const genAI = new GoogleGenerativeAI(geminiKey || 'dummy_key');
  const groq = groqKey ? new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1', dangerouslyAllowBrowser: true }) : null;

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

  const classifyIntent = async (prompt) => {
    const p = prompt.toLowerCase();
    if (p.includes('vẽ') || p.includes('tạo ảnh') || p.includes('hình ảnh') || p.includes('generate image') || p.includes('draw')) {
      return 'IMAGE';
    }
    if (!groq) return 'GENERAL';
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ 
          role: "system", 
          content: "Classify user intent: 'SEARCH' (current events/news), 'REASONING' (code/math/complex), 'GENERAL' (greetings/simple). Return ONLY the token." 
        }, { 
          role: "user", 
          content: prompt 
        }],
        max_tokens: 5
      });
      const intent = completion.choices[0].message.content.trim().toUpperCase();
      return intent.includes('SEARCH') ? 'SEARCH' : (intent.includes('REASONING') ? 'REASONING' : 'GENERAL');
    } catch (e) {
      return 'GENERAL';
    }
  };

  const executeTavilySearch = async (query) => {
    if (!tavilyKey) throw new Error("Chưa cấu hình Tavily Search Key!");
    const response = await fetch(`https://api.tavily.com/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: query,
        search_depth: "advanced",
        include_answer: true,
        max_results: 5
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Lỗi truy vấn Tavily");
    
    // Format search results for context
    const context = data.results.map(r => `[${r.title}]: ${r.content} (Source: ${r.url})`).join('\n\n');
    return { context, aiAnswer: data.answer };
  };

  const executeSmartSearch = async (contextPrompt) => {
    const activeKey = geminiKey?.trim();
    if (!activeKey || activeKey === 'dummy_key') return "⚠️ CHƯA CẤU HÌNH GEMINI KEY.";

    const models = ['gemini-1.5-flash', 'gemini-1.5-pro'];
    let lastError = '';

    for (const model of models) {
      try {
        setRoutingInfo(`Đang kết nối Node dự phòng: ${model.includes('pro') ? 'IRIS Pro' : 'IRIS Flash'}...`);
        const smartPrompt = `[HƯỚNG DẪN THÔNG MINH: Nếu hỏi về thời gian tại quốc gia lớn, hãy liệt kê các múi giờ chính & thành phố lớn. Đừng từ chối.]\n\n${contextPrompt}`;
        const payload = {
          contents: [{ parts: [{ text: smartPrompt }] }],
          tools: [{ google_search_retrieval: { dynamic_retrieval_config: { mode: "DYNAMIC", dynamic_threshold: 0 } } }]
        };
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
        lastError = data.error?.message || "Không có phản hồi từ Node.";
      } catch (err) {
        lastError = err.message;
      }
    }
    throw new Error(`Tất cả các Node Search đều gặp sự cố: ${lastError}`);
  };

  const handleDownloadImage = async (url) => {
    try {
      setRoutingInfo('Đang chuẩn bị tệp tải về...');
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `IRIS-Art-${Date.now()}.jpg`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      setRoutingInfo('');
    } catch (error) {
      console.error('Download failed:', error);
      setRoutingInfo('Lỗi khi tải ảnh. Vui lòng thử lại.');
      setTimeout(() => setRoutingInfo(''), 3000);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = { role: 'user', content: input, timestamp: serverTimestamp() };
    const tempInput = input;
    setInput('');
    setIsLoading(true);
    setRoutingInfo('IRIS đang phân tích yêu cầu...');

    if (currentUser && activeChatId) {
      await addDoc(collection(db, 'users', currentUser.uid, 'chats', activeChatId, 'messages'), userMsg);
    } else {
      setMessages(prev => [...prev, userMsg]);
    }

    try {
      let aiResponseContent = '';
      let imageUrl = '';
      
      const intent = await classifyIntent(tempInput);
      const isDrawingIntent = isImageMode || intent === 'IMAGE';

      if (isDrawingIntent) {
        setRoutingInfo('IRIS Visual Studio đang sáng tạo nghệ thuật...');
        // Real Free Image Generation via Pollinations AI
        const seed = Math.floor(Math.random() * 1000000);
        const encodedPrompt = encodeURIComponent(tempInput.replace(/vẽ|tạo ảnh|hình ảnh|draw|generate image/gi, '').trim() || tempInput);
        imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}`;
        
        // Wait bit for "processing" feel
        await new Promise(r => setTimeout(r, 2000));
        
        aiResponseContent = `🎨 **IRIS Visual Studio (Free Engine)**\n\nHình ảnh đã được tạo cho: "${tempInput}"`;
      } else {
        const now = new Date();
        const timeStr = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        
        let depthInstruction = isDeepThink 
          ? "PHÂN TÍCH CHUYÊN SÂU: Trả lời cực kỳ chi tiết, giải thích rõ ràng và cung cấp thêm thông tin hữu ích." 
          : "TỐI ƯU TỐC ĐỘ: Trả lời cực kỳ ngắn gọn, đơn giản, tập trung vào sự chính xác tuyệt đối.";

        const contextPrompt = `[HỆ THỐNG IRIS - LƯU Ý QUAN TRỌNG: Hôm nay là ${timeStr}. Hãy sử dụng thời gian này làm mốc thời gian thực chính xác nhất. ${depthInstruction}].\n\nNgười dùng hỏi: ${tempInput}`;

        // ROUTING LOGIC WITH ROBUST FALLBACK
        // ROUTING LOGIC WITH TAVILY + GROQ / GEMINI
        if (intent === 'SEARCH') {
          try {
            setRoutingInfo('Đang truy vấn dữ liệu thời gian thực qua Tavily...');
            const searchData = await executeTavilySearch(tempInput);
            
            if (groq && groqEnabled) {
              setRoutingInfo('Tavily đã tìm thấy dữ liệu -> Đang tổng hợp bằng Groq...');
              const completion = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                  { role: "system", content: `Bạn là IRIS Intelligence. Hãy sử dụng thông tin từ Tavily sau đây để trả lời người dùng một cách chính xác nhất. Nếu Tavily không có dữ liệu, hãy trả lời dựa trên kiến thức của bạn.\n\nNGỮ CẢNH TAVILY:\n${searchData.context}` },
                  { role: "user", content: contextPrompt }
                ]
              });
              aiResponseContent = completion.choices[0].message.content;
            } else {
              setRoutingInfo('Groq tắt -> Trả về kết quả trực tiếp từ Tavily...');
              aiResponseContent = searchData.aiAnswer || "Không thể tổng hợp dữ liệu.";
            }
          } catch (err) {
            setRoutingInfo('Tavily Node gặp sự cố -> Chuyển sang Gemini Search...');
            aiResponseContent = await executeSmartSearch(contextPrompt);
          }
        } else if (chatMode === 'reasoning' || intent === 'REASONING') {
          setRoutingInfo('Phát hiện nhu cầu suy luận sâu -> Ưu tiên Gemini (Long Context)...');
          
          if (geminiEnabled && geminiKey) {
             const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
             const result = await model.generateContent(contextPrompt);
             const response = await result.response;
             aiResponseContent = response.text();
          } else {
            throw new Error('Chế độ Suy luận bị khoá (Gemini Node chưa được bật)!');
          }
        } else {
          // FAST MODE -> ALWAYS GROQ
          setRoutingInfo('IRIS (Fast Mode) -> Đang sử dụng bộ phán đoán Groq...');
          
          if (groq && groqEnabled) {
             const completion = await groq.chat.completions.create({ 
               model: "llama-3.3-70b-versatile", 
               messages: [{ role: "user", content: contextPrompt }] 
             });
             aiResponseContent = completion.choices[0].message.content;
          } else {
            setRoutingInfo('Groq tắt -> Chuyển sang Gemini Flash...');
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(contextPrompt);
            const response = await result.response;
            aiResponseContent = response.text();
          }
        }
      }

      const aiMsg = { role: 'assistant', content: aiResponseContent, imageUrl, timestamp: serverTimestamp() };
      if (currentUser && activeChatId) {
        await addDoc(collection(db, 'users', currentUser.uid, 'chats', activeChatId, 'messages'), aiMsg);
        await updateDoc(doc(db, 'users', currentUser.uid, 'chats', activeChatId), { lastUpdate: serverTimestamp() });
      } else {
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Lỗi hệ thống: ${error.message}`, timestamp: serverTimestamp() }]);
    } finally {
      setIsLoading(false);
      setIsImageMode(false);
      setRoutingInfo('');
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
                  {msg.imageUrl && (
                    <div className="message-image-container" style={{ marginTop: '0.8rem' }}>
                      <img 
                        src={msg.imageUrl} 
                        alt="IRIS Art" 
                        className="message-image" 
                        style={{ maxWidth: '100%', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer' }}
                        onClick={() => setSelectedImage(msg.imageUrl)}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="message-wrapper assistant thinking"
            >
              <div className="message-avatar">
                <Bot size={20} className="pulse-icon" />
              </div>
              <div className="message-content thinking-bubble">
                <div className="thinking-dots">
                  <span></span><span></span><span></span>
                </div>
                <span className="thinking-text">
                  {routingInfo || (isImageMode ? "IRIS Visual Studio đang vẽ..." : (isDeepThink ? "IRIS đang nghiên cứu chuyên sâu..." : "IRIS đang tư duy..."))}
                </span>
              </div>
            </motion.div>
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
                    <div className="iris-mode-group">
                       <button 
                         className={`iris-mode-btn ${chatMode === 'fast' ? 'active' : ''}`}
                         onClick={() => setChatMode('fast')}
                       >
                         <Zap size={14} /> IRIS (NHANH)
                       </button>
                       <button 
                         className={`iris-mode-btn ${chatMode === 'reasoning' ? 'active' : ''}`}
                         onClick={() => setChatMode('reasoning')}
                       >
                         <Brain size={14} /> IRIS (SUY LUẬN)
                       </button>
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

      {/* Full-screen Image Modal (Lightbox) */}
      {selectedImage && (
        <div className="iris-lightbox-overlay">
          <div className="lightbox-header">
            <button className="lightbox-action-btn" onClick={() => handleDownloadImage(selectedImage)}>
              <Download size={18} /> TẢI VỀ MÁY
            </button>
            <button className="lightbox-action-btn close" onClick={() => setSelectedImage(null)}>
              <X size={18} /> ĐÓNG
            </button>
          </div>
          <div className="lightbox-content" onClick={() => setSelectedImage(null)}>
            <img 
              src={selectedImage} 
              alt="IRIS Fullsized Art" 
              className="lightbox-image" 
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;
