import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Save, Upload, Send, Image as ImageIcon, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import './BlogCMS.css';

const BlogCMS = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Post Data State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('Tech');
  const [thumbnail, setThumbnail] = useState('');
  const [published, setPublished] = useState(false);
  
  // UI State
  const [loading, setLoading] = useState(id !== 'new');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (id !== 'new') {
      fetchPost();
    }
  }, [id]);

  // Auto-generate slug from title if empty
  useEffect(() => {
    if (title && !slug && id === 'new') {
      const generatedSlug = title.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim().replace(/\s+/g, "-");
      setSlug(generatedSlug);
    }
  }, [title]);

  const fetchPost = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'blog_posts', id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.title || '');
        setSlug(data.slug || id);
        setContent(data.content || '');
        setExcerpt(data.excerpt || '');
        setCategory(data.category || 'Tech');
        setThumbnail(data.thumbnail || '');
        setPublished(data.published || false);
      } else {
        alert('Không tìm thấy bài viết đa cấu hình này!');
        navigate('/admin');
      }
    } catch (err) {
      alert('Lỗi truy xuất hệ thống: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleSave = async (isPublishing = false) => {
    if (!title.trim() || !content.trim()) {
      alert("Vui lòng điền đủ Tiêu đề và Nội dung bài viết.");
      return;
    }
    
    setSaving(true);
    try {
      const targetId = id === 'new' ? (slug || Date.now().toString()) : id;
      const postData = {
        id: targetId,
        title,
        slug: slug || targetId,
        content,
        excerpt: excerpt || content.substring(0, 150) + '...',
        category,
        thumbnail,
        published: isPublishing,
        date: new Date().toLocaleDateString('vi-VN'),
        timestamp: new Date(),
        author: 'BCT0902 Admin'
      };

      await setDoc(doc(db, 'blog_posts', targetId), postData, { merge: true });
      showStatus(isPublishing ? "ĐÃ XUẤT BẢN!" : "ĐÃ LƯU BẢN NHÁP!");
      
      if (id === 'new') {
        // Soft redirect to edit mode without full reload
        window.history.replaceState(null, '', `/admin/cms/${targetId}`);
      }
    } catch (err) {
      alert('Lỗi lưu báo cáo: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước ảnh tối đa là 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        // Advanced Auto-Compression (Target 1200x630 SEO friendly)
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_W = 1200;
          
          if (width > MAX_W) {
            height *= MAX_W / width;
            width = MAX_W;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          setThumbnail(canvas.toDataURL('image/jpeg', 0.8));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f14', color: '#fff' }}>Đang khởi tạo Môi trường Soạn thảo...</div>;

  return (
    <div className="cms-container">
      {/* HEADER BAR */}
      <header className="cms-header">
        <div className="cms-header-left">
          <button className="back-btn" onClick={() => navigate('/admin')}>
            <ArrowLeft size={18} />
          </button>
          <input 
            type="text" 
            className="cms-title-input" 
            placeholder="Nhập tiêu đề bài viết..." 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="cms-header-actions">
          <button 
            className="cms-btn draft" 
            disabled={saving} 
            onClick={() => handleSave(false)}
          >
            <Save size={16} /> LƯU NHÁP
          </button>
          <button 
            className="cms-btn publish" 
            disabled={saving} 
            onClick={() => handleSave(true)}
          >
            <Send size={16} /> XUẤT BẢN NGAY
          </button>
        </div>
      </header>

      {/* BODY AREA */}
      <div className="cms-body">
        
        {/* SIDEBAR METADATA */}
        <aside className="cms-sidebar">
          <div className="cms-sidebar-section">
             <label>ẢNH BÌA (COVER IMAGE)</label>
             <label className="cms-img-uploader" style={{ backgroundImage: thumbnail ? `url(${thumbnail})` : 'none' }}>
                {!thumbnail && (
                  <>
                    <Upload size={24} />
                    <span style={{ fontSize: '0.8rem' }}>Click tải ảnh lên</span>
                  </>
                )}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
             </label>
             {thumbnail && (
               <button onClick={() => setThumbnail('')} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', marginTop: '0.5rem' }}>Gỡ ảnh bìa</button>
             )}
          </div>

          <div className="cms-sidebar-section">
            <label>ĐƯỜNG DẪN BÀI VIẾT (SLUG)</label>
            <input 
              type="text" 
              className="cms-input" 
              value={slug} 
              onChange={e => setSlug(e.target.value)} 
              placeholder="VD: cac-tinh-nang-react-19" 
            />
          </div>

          <div className="cms-sidebar-section">
            <label>DANH MỤC LƯU TRỮ</label>
            <select 
              className="cms-input" 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              style={{ paddingRight: '2rem' }}
            >
               <option value="Tech">Technology (Tech)</option>
               <option value="DevLife">Developer Life</option>
               <option value="Tips">Thủ thuật (Tips & Tricks)</option>
               <option value="Hardware">Phần cứng (Hardware)</option>
               <option value="Cybersec">An toàn thông tin</option>
               <option value="Future">Tương lai (Future)</option>
            </select>
          </div>

          <div className="cms-sidebar-section">
            <label>TÓM TẮT (EXCERPT - SEO)</label>
            <textarea 
              className="cms-input cms-textarea" 
              value={excerpt} 
              onChange={e => setExcerpt(e.target.value)} 
              placeholder="Mô tả ngắn gọn nội dung bài viết để hiển thị trên thẻ bài và máy chủ tìm kiếm..." 
            />
          </div>
          
          <div className="cms-sidebar-section" style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
             <label>TRẠNG THÁI BÀI VIẾT</label>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: published ? '#10b981' : '#f59e0b', fontWeight: 'bold', fontSize: '0.9rem' }}>
               <div style={{ width: 10, height: 10, borderRadius: '50%', background: published ? '#10b981' : '#f59e0b', boxShadow: `0 0 10px ${published ? '#10b981' : '#f59e0b'}` }} />
               {published ? 'ĐÃ CÔNG KHAI' : 'BẢN NHÁP ẨN'}
             </div>
          </div>
        </aside>

        {/* EDITOR AREA */}
        <div className="cms-editor-pane">
          <textarea 
            className="cms-markdown-input"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="# Bắt đầu viết nội dung tại đây...&#10;&#10;Hỗ trợ Markdown. Bạn có thể sử dụng h2 (##), danh sách, blockquote, code blocks và chèn ảnh ![alt](link)"
          />
          
          <div className="cms-preview-pane">
             <div className="cms-preview-content">
               {content ? (
                 <ReactMarkdown
                   remarkPlugins={[remarkGfm]}
                   components={{
                     code({node, inline, className, children, ...props}) {
                       const match = /language-(\w+)/.exec(className || '')
                       return !inline && match ? (
                         <SyntaxHighlighter
                           style={vscDarkPlus}
                           language={match[1]}
                           PreTag="div"
                           {...props}
                         >
                           {String(children).replace(/\n$/, '')}
                         </SyntaxHighlighter>
                       ) : (
                         <code className={className} {...props}>
                           {children}
                         </code>
                       )
                     }
                   }}
                 >
                   {content}
                 </ReactMarkdown>
               ) : (
                 <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '4rem', opacity: 0.5 }}>
                   <ImageIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                   <h2>BẢN XEM TRƯỚC (PREVIEW)</h2>
                   <p>Nội dung bạn gõ bên trái sẽ được Render lập tức tại đây.</p>
                 </div>
               )}
             </div>
          </div>
          
          {/* Status Toast Overlay */}
          <div className={`cms-floating-status ${statusMsg ? 'show' : ''}`}>
             <CheckCircle size={16} />
             <span>{statusMsg}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BlogCMS;
