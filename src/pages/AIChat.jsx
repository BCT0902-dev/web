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
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import './AIChat.css';

const AIChat = () => {
  const { config } = useConfig();
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const [guestMsgCount, setGuestMsgCount] = useState(0);
  const messagesEndRef = useRef(null);
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  const codeTheme = theme === 'dark' ? atomDark : oneLight;

  // Initialize AI clients with config keys
  const geminiKey = config?.integrations?.geminiKey || import.meta.env.VITE_GEMINI_API_KEY;
  const deepseekKey = config?.integrations?.deepseekKey || import.meta.env.VITE_DEEPSEEK_API_KEY;

  const genAI = new GoogleGenerativeAI(geminiKey || 'dummy_key');
  const deepseek = new OpenAI({
    apiKey: deepseekKey || 'dummy_key',
    baseURL: 'https://api.deepseek.com',
    dangerouslyAllowBrowser: true
  });

  // Load guest message count from sessionStorage
  useEffect(() => {
    if (!currentUser) {
      const count = sessionStorage.getItem('bct_guest_msg_count') || 0;
      setGuestMsgCount(parseInt(count));
      setShowGuestPopup(true);
    }
  }, [currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!currentUser) return;
    // ... logic for authenticated user remains the same
    const chatsRef = collection(db, 'users', currentUser.uid, 'chats');
    const q = query(chatsRef, orderBy('lastUpdate', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChatHistory(chats);
      
      if (!activeChatId && chats.length > 0) {
        setActiveChatId(chats[0].id);
      }
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

  const createNewChat = async () => {
    if (!currentUser) {
      setMessages([]);
      setActiveChatId(null);
      return;
    }

    const chatsRef = collection(db, 'users', currentUser.uid, 'chats');
    const newChat = {
        title: 'Bản thảo hội thoại ' + (chatHistory.length + 1),
        lastUpdate: serverTimestamp(),
        model: selectedModel
    };

    const docRef = await addDoc(chatsRef, newChat);
    setActiveChatId(docRef.id);
    setMessages([]);
  };

  const deleteChat = async (e, id) => {
    e.stopPropagation();
    if (!currentUser) return;

    try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'chats', id));
        if (activeChatId === id) {
            setActiveChatId(null);
            setMessages([]);
        }
    } catch (err) {
        console.error("Lỗi xóa chat:", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Check guest limit
    if (!currentUser && guestMsgCount >= 10) {
      setShowGuestPopup(true);
      return;
    }

    const newMessage = { 
        role: 'user', 
        content: input,
        timestamp: currentUser ? serverTimestamp() : new Date() 
    };

    if (currentUser) {
        let chatId = activeChatId;

        if (!chatId) {
            const chatsRef = collection(db, 'users', currentUser.uid, 'chats');
            const newDoc = await addDoc(chatsRef, {
                title: input.slice(0, 30),
                lastUpdate: serverTimestamp(),
                model: selectedModel
            });
            chatId = newDoc.id;
            setActiveChatId(chatId);
        }

        const msgsRef = collection(db, 'users', currentUser.uid, 'chats', chatId, 'messages');
        await addDoc(msgsRef, newMessage);
        
        if (messages.length === 0) {
            await updateDoc(doc(db, 'users', currentUser.uid, 'chats', chatId), {
                title: input.slice(0, 30),
                lastUpdate: serverTimestamp()
            });
        }
    } else {
        // Guest mode - Local state only
        setMessages(prev => [...prev, newMessage]);
        const newCount = guestMsgCount + 1;
        setGuestMsgCount(newCount);
        sessionStorage.setItem('bct_guest_msg_count', newCount.toString());
    }

    setInput('');
    setIsLoading(true);

    try {
      let aiResponseContent = '';

      if (selectedModel === 'gemini') {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(input);
        aiResponseContent = result.response.text();
      } else {
        const completion = await deepseek.chat.completions.create({
          messages: [...messages, { role: 'user', content: input }],
          model: 'deepseek-chat',
        });
        aiResponseContent = completion.choices[0].message.content;
      }

      const aiMessage = {
        role: 'assistant',
        content: aiResponseContent,
        timestamp: currentUser ? serverTimestamp() : new Date()
      };

      if (currentUser) {
        const msgsRef = collection(db, 'users', currentUser.uid, 'chats', activeChatId, 'messages');
        await addDoc(msgsRef, aiMessage);
        await updateDoc(doc(db, 'users', currentUser.uid, 'chats', activeChatId), {
            lastUpdate: serverTimestamp()
        });
      } else {
        setMessages(prev => [...prev, aiMessage]);
      }

    } catch (error) {
      console.error(error);
      const errorMessage = {
        role: 'assistant',
        content: "❌ Lỗi: Có vẻ như bạn chưa cấu hình API Key hoặc có lỗi kết nối. Vui lòng kiểm tra file .env",
        timestamp: currentUser ? serverTimestamp() : new Date()
      };
      if (currentUser) {
        const msgsRef = collection(db, 'users', currentUser.uid, 'chats', activeChatId, 'messages');
        await addDoc(msgsRef, errorMessage);
      } else {
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="ai-chat-container">
      {/* Guest Popup */}
      <AnimatePresence>
        {showGuestPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="guest-popup-overlay"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="guest-popup-card"
            >
              <Shield size={48} color="var(--accent-main)" className="popup-icon" />
              <h3>{guestMsgCount >= 10 ? 'Đã đạt giới hạn!' : 'Chế độ khách đang bật'}</h3>
              <p>
                {guestMsgCount >= 10 
                  ? 'Bạn đã sử dụng hết 10 câu hỏi miễn phí dành cho khách. Vui lòng đăng nhập để tiếp tục trò chuyện không giới hạn.' 
                  : 'Bạn đang sử dụng Chat AI với tư cách khách. Lịch sử sẽ không được lưu nếu bạn tải lại trang và bạn bị hạn chế 10 câu hỏi.'}
              </p>
              <div className="popup-actions">
                <button className="login-now-btn" onClick={() => navigate('/login')}>
                  ĐĂNG NHẬP NGAY
                </button>
                {guestMsgCount < 10 && (
                  <button className="continue-guest-btn" onClick={() => setShowGuestPopup(false)}>
                    TIẾP TỤC TRẢI NGHIỆM ({10 - guestMsgCount} lượt còn lại)
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Lịch sử Chat */}
      <motion.div 
        className={`chat-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}
        initial={false}
        animate={{ width: isSidebarOpen ? 300 : 0 }}
      >
        <div className="sidebar-content-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="sidebar-header">
            <button className="new-chat-btn" onClick={createNewChat}>
              <PlusCircle size={18} />
              <span>KHỞI TẠO LUỒNG MỚI</span>
            </button>
          </div>

          <div className="history-list">
            <div className="history-label">
              <History size={14} /> {currentUser ? 'GẦN ĐÂY' : 'CHẾ ĐỘ KHÁCH'}
            </div>
            {currentUser ? chatHistory.map(chat => (
              <motion.div 
                key={chat.id} 
                whileHover={{ x: 5 }}
                className={`history-item ${activeChatId === chat.id ? 'active' : ''}`}
                onClick={() => setActiveChatId(chat.id)}
              >
                <MessageSquare size={16} className="item-icon" />
                <div className="chat-title">{chat.title}</div>
                <button className="delete-btn" onClick={(e) => deleteChat(e, chat.id)}>
                  <Eraser size={14} />
                </button>
              </motion.div>
            )) : (
              <div className="guest-history-placeholder">
                <Shield size={32} opacity={0.2} />
                <p>Lịch sử chỉ được lưu khi bạn đăng nhập tài khoản</p>
              </div>
            )}
          </div>

          {/* Sidebar Footer - Settings */}
          <div className="sidebar-footer">
            <button className="sidebar-action-btn" onClick={() => navigate('/settings')}>
              <Settings size={18} />
              <span>Cài đặt tài khoản</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main interface */}
      <div className="main-chat-area">
        <header className="chat-header">
          <button className="toggle-sidebar" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Terminal size={20} style={{ transform: isSidebarOpen ? 'none' : 'rotate(180deg)' }} />
          </button>
          
          <div className="header-title">
            <Bot size={20} className="header-icon" />
            <span>CORE ASSISTANT</span>
          </div>

          <div className="header-actions">
            <div className="header-status">
              <div className={`status-dot ${isLoading ? 'pulse' : ''}`} />
              <span>{isLoading ? 'ANALYZING...' : 'SECURE'}</span>
            </div>
            
            {!currentUser && (
              <button className="login-header-btn" onClick={() => navigate('/login')}>
                <User size={16} /> ĐĂNG NHẬP
              </button>
            )}
            {currentUser && (
               <div className="user-profile-mini">
                  <div className="avatar-small">
                    {currentUser.photoURL ? <img src={currentUser.photoURL} alt="User" /> : <User size={16} />}
                  </div>
               </div>
            )}
          </div>
        </header>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="welcome-card"
              >
                <div className="welcome-icon">
                  <Bot size={64} />
                </div>
                <h2>BCT CORE ENGINE</h2>
                <div className="welcome-text-content">
                  <p>
                    {config?.content?.welcomeMessage || 
                      (currentUser 
                        ? 'Hệ thống AI Assistant được đồng bộ hóa đám mây. Hãy nhập lệnh hoặc đặt câu hỏi để bắt đầu phiên làm việc.' 
                        : 'Bạn đang sử dụng phiên bản giới hạn dành cho khách. Hãy đăng nhập để lưu trữ vĩnh viễn mọi hội thoại của bạn.')
                    }
                  </p>
                </div>
                <div className="feature-tags">
                  <span>#GUEST_ACCESS</span>
                  <span>#V3_PROTOCOL</span>
                  <span>#DEEPSEEK</span>
                  <span>{currentUser ? '#SECURE_SYNC' : '#10_MSGS_LIMIT'}</span>
                </div>
              </motion.div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`message-wrapper ${msg.role}`}
              >
                <div className="message-avatar">
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className="message-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <div className="code-block-wrapper">
                            <div className="code-header">
                              <span className="lang-badge">{match[1].toUpperCase()} SOURCE</span>
                              <button onClick={() => copyToClipboard(String(children))}>
                                <Copy size={14} />
                              </button>
                            </div>
                            <SyntaxHighlighter
                              style={codeTheme}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          {/* Model selection moved inside input container */}
          <div className="input-model-pills">
            <button 
              className={`pill-btn ${selectedModel === 'gemini' ? 'active' : ''}`}
              onClick={() => setSelectedModel('gemini')}
            >
              <Sparkles size={14} /> Gemini
            </button>
            <button 
              className={`pill-btn ${selectedModel === 'deepseek' ? 'active' : ''}`}
              onClick={() => setSelectedModel('deepseek')}
            >
              <Cpu size={14} /> DeepSeek
            </button>
          </div>

          <div className={`input-glow-wrapper ${isFocused ? 'focus' : ''} ${isLoading ? 'loading' : ''} ${(!currentUser && guestMsgCount >= 10) ? 'locked' : ''}`}>
            <div className="input-wrapper">
              <textarea
                placeholder={(!currentUser && guestMsgCount >= 10) ? 'Vui lòng đăng nhập để tiếp tục...' : `Hỏi ${selectedModel === 'gemini' ? 'Gemini' : 'DeepSeek'} về bất cứ điều gì...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={!currentUser && guestMsgCount >= 10}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
              />
              <button 
                className={`send-btn ${input.trim() ? 'active' : ''}`} 
                onClick={handleSend}
                disabled={isLoading || !input.trim() || (!currentUser && guestMsgCount >= 10)}
              >
                <Send size={22} />
              </button>
            </div>
          </div>
          <p className="input-footer">
            {currentUser 
              ? 'AES-256 ENCRYPTED VIA GOOGLE FIREBASE PROTOCOL' 
              : `GUEST MODE: ${guestMsgCount}/10 MESSAGES USED`}
          </p>
        </div>
      </div>

    </div>
  );
};

export default AIChat;
