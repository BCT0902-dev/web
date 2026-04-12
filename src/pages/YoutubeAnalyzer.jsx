import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Search, ArrowRight, FileText, Globe, BookOpen, AlertCircle, Loader2, Sparkles, ChevronLeft, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useConfig } from '../context/ConfigContext';

const YoutubeAnalyzer = () => {
  const navigate = useNavigate();
  const { config } = useConfig();
  const [url, setUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');
  const [activeTask, setActiveTask] = useState(null); // 'summary', 'translate', 'vocab'
  const [targetLang, setTargetLang] = useState('vi');

  const geminiKey = config?.integrations?.geminiKey || import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(geminiKey || 'dummy_key');

  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const currentVideoId = extractVideoId(url);
  const thumbnailUrl = currentVideoId ? `https://img.youtube.com/vi/${currentVideoId}/maxresdefault.jpg` : null;

  const fetchTranscript = async (videoId) => {
    try {
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const response = await fetch(proxyUrl + encodeURIComponent(youtubeUrl));
        const data = await response.json();
        const html = data.contents;
        
        const match = html.match(/"captions":({.*?})/);
        if (match) {
            const captionsData = JSON.parse(match[1]);
            const tracks = captionsData?.playerCaptionsTracklistRenderer?.captionTracks;
            if (tracks && tracks.length > 0) {
                // Lấy phụ đề tiếng Việt nếu có, hoặc lấy cái đầu tiên
                const viTrack = tracks.find(t => t.languageCode === 'vi') || tracks[0];
                const transcriptUrl = viTrack.baseUrl;
                const transcriptRes = await fetch(proxyUrl + encodeURIComponent(transcriptUrl));
                const transcriptData = await transcriptRes.json();
                const xml = transcriptData.contents;
                
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xml, "text/xml");
                const texts = xmlDoc.getElementsByTagName("text");
                const decodeHTMLEntities = (text) => {
                    const textArea = document.createElement('textarea');
                    textArea.innerHTML = text;
                    return textArea.value;
                };
                let fullText = "";
                for (let i = 0; i < texts.length; i++) {
                    fullText += decodeHTMLEntities(texts[i].textContent) + " ";
                }
                return fullText;
            }
        }
        throw new Error('Video không có phụ đề (caption) hoặc bị chặn.');
    } catch (e) {
        console.error(e);
        throw e;
    }
  };

  const handleProcess = async (task, lang = 'vi') => {
    if (!url.trim() && !transcript.trim()) {
      alert('Vui lòng dán URL Youtube hoặc nội dung Script để AI phân tích!');
      return;
    }

    setIsProcessing(true);
    setActiveTask(task);
    setResult('');

    try {
      let finalTranscript = transcript;
      
      // Auto fetch if URL is provided but transcript is empty
      if (!finalTranscript.trim() && currentVideoId) {
         try {
            finalTranscript = await fetchTranscript(currentVideoId);
            setTranscript(finalTranscript);
         } catch (e) {
            alert('Không thể tự động lấy phụ đề qua đường link này. Vui lòng thử dán Script của Video thủ công nhé!');
            setIsProcessing(false);
            return;
         }
      }

      if (!finalTranscript.trim()) {
         alert('Không có nội dung để phân tích!');
         setIsProcessing(false);
         return;
      }

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      let prompt = '';

      if (task === 'summary') {
        prompt = `Hãy tóm tắt nội dung chính của video/phụ đề sau đây một cách súc tích và mạch lạc bằng tiếng Việt: \n\n ${finalTranscript}`;
      } else if (task === 'translate') {
        const langMap = { 'vi': 'Tiếng Việt', 'en': 'Tiếng Anh', 'jp': 'Tiếng Nhật', 'kr': 'Tiếng Hàn' };
        prompt = `Hãy dịch nội dung sau đây sang ${langMap[lang]}. Hãy đảm bảo bản dịch tự nhiên và chính xác: \n\n ${finalTranscript}`;
      } else if (task === 'vocab') {
        prompt = `Hãy liệt kê khoảng 10-15 từ vựng/cụm từ quan trọng trong đoạn nội dung sau. Với mỗi từ, hãy ghi rõ nghĩa (tiếng Việt), cách phát âm và ví dụ đặt câu: \n\n ${finalTranscript}`;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setResult(response.text());
    } catch (error) {
      console.error('AI Processing Error:', error);
      setResult('Đã xảy ra lỗi trong quá trình xử lý. Vui lòng kiểm tra lại API Key hoặc nội dung văn bản.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="cyber-matrix-container" style={{ paddingTop: '8rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .cyber-matrix-container {
          background-color: var(--bg-primary);
          transition: background-color 0.3s ease;
        }
        .cyber-grid-layer {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: 
            repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0, 240, 255, 0.05) 40px, rgba(0, 240, 255, 0.05) 41px),
            repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0, 240, 255, 0.05) 40px, rgba(0, 240, 255, 0.05) 41px);
          z-index: 0;
          pointer-events: none;
        }
        [data-theme='light'] .cyber-grid-layer {
          background: 
            repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(37, 99, 235, 0.06) 40px, rgba(37, 99, 235, 0.06) 41px),
            repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(37, 99, 235, 0.06) 40px, rgba(37, 99, 235, 0.06) 41px);
        }
        .cyber-scanline {
          position: absolute;
          top: 0; left: 0; right: 0; height: 3px;
          background: var(--accent-main);
          box-shadow: 0 0 15px var(--accent-main);
          opacity: 0.3;
          animation: scanDown 4s linear infinite;
          z-index: 1;
          pointer-events: none;
        }
        @keyframes scanDown {
          0% { top: -10px; opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
      
      <div className="cyber-grid-layer" />
      <div className="cyber-scanline" />
      
      <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 5 }}>
        {/* Back Button */}
        <button 
          onClick={() => navigate('/utilities')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            color: 'var(--accent-main)', 
            background: 'transparent',
            marginBottom: '2rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <ChevronLeft size={20} /> QUAY LẠI GALLERY
        </button>

        <div className="hub-header" style={{ textAlign: 'left', marginBottom: '3rem', border: 'none' }}>
           <h1 style={{ fontSize: '3rem', letterSpacing: '5px' }}>YT SMART ANALYZER</h1>
           <p>Phòng thí nghiệm phân tích nội dung số đa ngôn ngữ</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '35% 1fr', gap: '2.5rem' }}>
          {/* Left Column: Input & Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* URL Scanning Box */}
            <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--accent-glow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: 'var(--accent-main)' }}>
                 <Play size={24} /> <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>SCAN VIDEO URL</span>
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="https://www.youtube.com/watch?v=..." 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    paddingLeft: '3rem',
                    background: 'var(--bg-primary)', 
                    border: '1px solid var(--bg-glass-border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
              </div>

              {thumbnailUrl && (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   style={{ marginTop: '1.5rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--bg-glass-border)' }}
                >
                  <img src={thumbnailUrl} alt="Thumbnail" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </motion.div>
              )}
            </div>

            {/* Control Panel */}
            <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: 'var(--accent-secondary)' }}>
                 <Cpu size={24} /> <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>AI OPERATIONS</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button 
                  className="btn-secondary" 
                  style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}
                  onClick={() => handleProcess('summary')}
                  disabled={isProcessing}
                >
                  <Sparkles size={18} /> TÓM TẮT
                </button>
                <button 
                   className="btn-secondary" 
                   style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}
                   onClick={() => handleProcess('vocab')}
                   disabled={isProcessing}
                >
                  <BookOpen size={18} /> HỌC TỪ VỰNG
                </button>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem', fontFamily: 'var(--font-mono)' }}>DỊCH THUẬT NỘI DUNG</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['vi', 'en', 'jp', 'kr'].map(lang => (
                    <button 
                      key={lang}
                      onClick={() => { setTargetLang(lang); handleProcess('translate', lang); }}
                      disabled={isProcessing}
                      style={{ 
                        padding: '0.5rem 1rem', 
                        background: targetLang === lang ? 'var(--accent-main)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--bg-glass-border)',
                        borderRadius: '4px',
                        color: targetLang === lang ? '#fff' : 'var(--text-primary)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        textTransform: 'uppercase'
                      }}
                    >
                      {lang === 'vi' ? '🇻🇳 VN' : lang === 'en' ? '🇺🇸 EN' : lang === 'jp' ? '🇯🇵 JP' : '🇰🇷 KR'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '600px' }}>
            {/* Results Display */}
            <div 
              className="glass-panel" 
              style={{ 
                padding: '1.5rem', 
                flex: 1, 
                minHeight: '400px',
                background: 'var(--bg-glass)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--bg-glass-border)',
                position: 'relative',
                overflowY: 'auto'
              }}
            >
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
                  >
                    <Loader2 size={48} className="spin" style={{ color: 'var(--accent-main)' }} />
                    <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-main)', fontSize: '0.9rem' }}>ANALYZING CONTENT...</p>
                  </motion.div>
                ) : result ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="markdown-content"
                    style={{ fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--text-primary)' }}
                  >
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </motion.div>
                ) : (
                  <div key="empty" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                    <Cpu size={64} />
                    <p style={{ marginTop: '1rem', fontFamily: 'var(--font-mono)' }}>READY FOR ANALYSIS</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YoutubeAnalyzer;
