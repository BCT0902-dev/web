import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Search, ArrowRight, FileText, Globe, BookOpen, AlertCircle, Loader2, Sparkles, ChevronLeft, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useConfig } from '../context/ConfigContext';
import AIModelPills from '../components/AIModelPills';
import OpenAI from 'openai';

const YoutubeAnalyzer = () => {
  const navigate = useNavigate();
  const { config } = useConfig();
  const [url, setUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');
  const [activeTask, setActiveTask] = useState(null); // 'summary', 'translate', 'vocab'
  const [targetLang, setTargetLang] = useState('vi');
  const [selectedModel, setSelectedModel] = useState('groq');

  const geminiKey = config?.integrations?.geminiKey || import.meta.env.VITE_GEMINI_API_KEY;
  const deepseekKey = config?.integrations?.deepseekKey || import.meta.env.VITE_DEEPSEEK_API_KEY;
  const groqKey = config?.integrations?.groqKey;

  const genAI = new GoogleGenerativeAI(geminiKey || 'dummy_key');
  const deepseek = new OpenAI({ apiKey: deepseekKey || 'dummy_key', baseURL: 'https://api.deepseek.com', dangerouslyAllowBrowser: true });
  const groq = groqKey ? new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1', dangerouslyAllowBrowser: true }) : null;

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


      let prompt = '';
      if (task === 'summary') {
        prompt = `Hãy tóm tắt nội dung chính của video/phụ đề sau đây một cách chuyên nghiệp, súc tích và mạch lạc bằng tiếng Việt. Sử dụng các gạch đầu dòng để làm nổi bật các ý chính: \n\n ${finalTranscript}`;
      } else if (task === 'translate') {
        const langMap = { 'vi': 'Tiếng Việt', 'en': 'Tiếng Anh', 'jp': 'Tiếng Nhật', 'kr': 'Tiếng Hàn' };
        prompt = `Bạn là một chuyên gia biên dịch. Hãy tự nhận diện ngôn ngữ gốc của nội dung sau đây và dịch toàn bộ sang ${langMap[lang]}. Đảm bảo văn phong tự nhiên, trôi chảy và giữ nguyên ý nghĩa chuyên môn: \n\n ${finalTranscript}`;
      } else if (task === 'vocab') {
        const langMap = { 'vi': 'Tiếng Việt', 'en': 'Tiếng Anh', 'jp': 'Tiếng Nhật', 'kr': 'Tiếng Hàn' };
        prompt = `Bạn là một giáo viên ngôn ngữ. Hãy lọc ra khoảng 10-15 từ vựng hoặc cụm từ quan trọng nhất bằng ${langMap[lang]} có trong đoạn nội dung sau. Với mỗi từ, hãy cung cấp: \n1. Từ/Cụm từ \n2. Nghĩa tiếng Việt \n3. Cách phát âm \n4. Ví dụ câu thực tế từ video kèm bản dịch. \n\nNội dung video: \n\n ${finalTranscript}`;
      }

      let resultText = '';

      if (selectedModel === 'gemini') {
          const payload = { contents: [{ parts: [{ text: prompt }] }] };
          
          // Using robust v1 endpoint with fallback
          let response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(payload)
          });
          
          let data = await response.json();
          
          if (!response.ok || data.error) {
            response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(payload)
            });
            data = await response.json();
          }
          
          resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lỗi phản hồi từ Gemini.";
      } else if (selectedModel === 'groq') {
          if (!groq) throw new Error('Chưa cấu hình Groq Key!');
          const completion = await groq.chat.completions.create({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }] });
          resultText = completion.choices[0].message.content;
      } else {
          const completion = await deepseek.chat.completions.create({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }] });
          resultText = completion.choices[0].message.content;
      }

      setResult(resultText);
    } catch (error) {
      console.error('AI Processing Error:', error);
      setResult('Đã xảy ra lỗi trong quá trình xử lý. Vui lòng kiểm tra lại API Key hoặc nội dung văn bản.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="cyber-matrix-container" style={{ paddingTop: '6rem', minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto' }}>
      <style>{`
        .cyber-matrix-container {
          background-color: transparent;
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

      <div className="container" style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', position: 'relative', zIndex: 5, padding: '0 2rem' }}>
        {/* Back Button */}
        <button 
          onClick={() => navigate('/utilities')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-main)', background: 'transparent', marginBottom: '2rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', cursor: 'pointer', border: 'none' }}
        >
          <ChevronLeft size={20} /> QUAY LẠI GALLERY
        </button>

        <div className="hub-header" style={{ textAlign: 'left', marginBottom: '1.5rem', border: 'none', padding: 0 }}>
           <h1 style={{ fontSize: '2.5rem', letterSpacing: '5px', color: 'var(--text-primary)' }}>YT SMART ANALYZER</h1>
           <p style={{ color: 'var(--text-muted)' }}>Phòng thí nghiệm phân tích nội dung số đa ngôn ngữ</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
          
          {/* TOP BANNER: URL SCANNER */}
          <div className="glass-panel" style={{ padding: '1.5rem 2rem', border: '1px solid var(--accent-glow)', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: 'var(--accent-main)' }}>
                 <Play size={24} /> <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>SCAN VIDEO URL</span>
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="https://www.youtube.com/watch?v=..." 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{ width: '100%', padding: '1.2rem', paddingLeft: '3.5rem', background: 'var(--bg-primary)', border: '1px solid var(--bg-glass-border)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '1.05rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}
                />
                <Search size={20} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, color: 'var(--text-primary)' }} />
              </div>
            </div>
            
            {thumbnailUrl && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ width: '320px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--bg-glass-border)', flexShrink: 0, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                <img src={thumbnailUrl} alt="Thumbnail" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </motion.div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 25%) 1fr', gap: '2rem' }}>
            {/* LEFT: CONTROLS */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: 'fit-content', border: '1px solid var(--bg-glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: '#b8860b' }}>
                 <Cpu size={24} /> <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>AI CORE ENGINE</span>
              </div>
              


              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '0.8rem 0', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--accent-main)' }} onClick={() => handleProcess('summary')} disabled={isProcessing}>
                  <Sparkles size={16} /> TÓM TẮT CORE
                </button>
                
                <div style={{ marginTop: '0.5rem' }}>
                   <p style={{ fontSize: '0.7rem', color: '#999', marginBottom: '0.5rem', fontWeight: 600 }}>DỊCH TOÀN BỘ</p>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                      {['vi', 'en', 'jp', 'kr'].map(lang => (
                        <button key={lang} onClick={() => handleProcess('translate', lang)} style={{ padding: '0.5rem 0', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}>
                          {lang.toUpperCase()}
                        </button>
                      ))}
                   </div>
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                   <p style={{ fontSize: '0.7rem', color: '#999', marginBottom: '0.5rem', fontWeight: 600 }}>HỌC TỪ VỰNG</p>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                      <button onClick={() => handleProcess('vocab', 'en')} style={{ padding: '0.5rem 0', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}>🇺🇸 TIẾNG ANH</button>
                      <button onClick={() => handleProcess('vocab', 'jp')} style={{ padding: '0.5rem 0', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}>🇯🇵 TIẾNG NHẬT</button>
                   </div>
                </div>
              </div>

              <div style={{ marginTop: '2.5rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>DỊCH THUẬT AUTO</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  {['vi', 'en', 'jp', 'kr'].map(lang => (
                    <button 
                      key={lang}
                      onClick={() => { setTargetLang(lang); handleProcess('translate', lang); }}
                      disabled={isProcessing}
                      style={{ padding: '0.8rem 0', background: targetLang === lang ? 'var(--accent-main)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--bg-glass-border)', borderRadius: '6px', color: targetLang === lang ? '#fff' : 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer', textTransform: 'uppercase', fontWeight: targetLang === lang ? 'bold' : 'normal', transition: 'all 0.2s', boxShadow: targetLang === lang ? '0 4px 10px rgba(var(--accent-rgb), 0.3)' : 'none' }}
                    >
                      {lang === 'vi' ? '🇻🇳 VN' : lang === 'en' ? '🇺🇸 EN' : lang === 'jp' ? '🇯🇵 JP' : '🇰🇷 KR'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: RESULTS */}
             <div className="glass-panel" style={{ padding: '2.5rem', minHeight: '400px', background: 'var(--bg-glass)', backdropFilter: 'blur(10px)', border: '1px inset var(--bg-glass-border)', position: 'relative', overflowY: 'auto', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)' }}>
               {/* Model pills moved to top of result area */}
               <div style={{ position: 'sticky', top: '-1rem', zIndex: 100, background: 'var(--bg-glass)', padding: '0.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
                  <AIModelPills selectedModel={selectedModel} onModelChange={setSelectedModel} />
               </div>

               <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', paddingTop: '4rem' }}>
                    <Loader2 size={48} className="spin" style={{ color: 'var(--accent-main)' }} />
                    <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-main)', fontSize: '0.9rem', letterSpacing: '2px' }}>AI IS ANALYZING DATA STREAM...</p>
                  </motion.div>
                ) : result ? (
                  <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="markdown-content" style={{ fontSize: '1.05rem', lineHeight: '1.8', color: 'var(--text-primary)' }}>
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </motion.div>
                ) : (
                  <div key="empty" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.15 }}>
                    <Cpu size={80} style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }} />
                    <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', letterSpacing: '3px', color: 'var(--text-primary)' }}>SYSTEM READY</h3>
                    <p style={{ marginTop: '0.5rem', fontSize: '1rem', color: 'var(--text-primary)' }}>Waiting for Target URL input...</p>
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
