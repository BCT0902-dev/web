import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Calendar, User, Tag, Share2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const BlogPost = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            const docRef = doc(db, 'blog_posts', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setPost({ id: docSnap.id, ...docSnap.data() });
            }
            setLoading(false);
        };
        fetchPost();
    }, [id]);

    if (loading) return <div style={{ paddingTop: '100px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading insight...</div>;
    if (!post) return <div style={{ paddingTop: '100px', textAlign: 'center', color: 'var(--text-secondary)' }}>Insight not found.</div>;

    return (
        <div className="blog-post-view" style={{ paddingTop: '100px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <button 
                  onClick={() => navigate('/blog')} 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: 'var(--accent-main)', cursor: 'pointer', marginBottom: '2rem', fontFamily: 'var(--font-mono)' }}
                >
                    <ChevronLeft size={20} /> BACK TO INSIGHTS
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <header style={{ marginBottom: '3rem' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={16} /> {post.date}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Tag size={16} /> {post.category}</span>
                        </div>
                        <h1 style={{ fontSize: '3rem', lineHeight: '1.2', marginBottom: '2rem', fontFamily: 'Chakra Petch' }} className="text-gradient">
                            {post.title}
                        </h1>
                        {post.thumbnail && (
                            <img src={post.thumbnail} alt={post.title} style={{ width: '100%', borderRadius: '24px', marginBottom: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }} />
                        )}
                    </header>

                    <div className="markdown-content" style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-primary)' }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                    </div>

                    <footer style={{ marginTop: '5rem', paddingTop: '2rem', borderTop: '1px solid var(--bg-glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                           <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User size={20} color="#000" />
                           </div>
                           <div>
                              <p style={{ margin: 0, fontWeight: 600 }}>{post.author || 'BCT0902'}</p>
                              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>AI Research & Dev</p>
                           </div>
                        </div>
                        <button className="glass-panel" style={{ padding: '0.8rem', borderRadius: '50%', display: 'flex' }} onClick={() => navigator.clipboard.writeText(window.location.href)}>
                           <Share2 size={20} />
                        </button>
                    </footer>
                </motion.div>
            </div>
        </div>
    );
};

export default BlogPost;
