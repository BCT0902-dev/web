import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Calendar, User, ArrowRight, Search, Tag } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from 'react-router-dom';

const Blog = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'blog_posts'), where('published', '==', true), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="blog-container" style={{ paddingTop: '100px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div className="container">
        <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-gradient"
            style={{ fontSize: '3.5rem', marginBottom: '1rem', fontFamily: 'Chakra Petch' }}
          >
            AI INSIGHTS
          </motion.h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            {t('blog.subtitle', 'Exploring the frontiers of AI, Web Development, and Digital Creativity.')}
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2.5rem' }}>
          {loading ? (
            <p>Loading posts...</p>
          ) : posts.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
               <Search size={48} style={{ marginBottom: '1rem' }} />
               <p>No insights found yet. Check back soon!</p>
            </div>
          ) : posts.map((post, idx) => (post.published !== false && (
            <motion.article 
              key={post.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="glass-panel post-card"
              style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              {post.thumbnail && (
                <div style={{ height: '220px', overflow: 'hidden' }}>
                   <img src={post.thumbnail} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} />
                </div>
              )}
              <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--accent-main)', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14} /> {post.date}</span>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Tag size={14} /> {post.category || 'Tech'}</span>
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', lineHeight: '1.3' }}>{post.title}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', flex: 1 }}>{post.excerpt}</p>
                <Link to={`/blog/${post.id}`} className="read-more-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-main)', fontWeight: 600, fontSize: '0.9rem' }}>
                  READ INSIGHT <ArrowRight size={16} />
                </Link>
              </div>
            </motion.article>
          )))}
        </div>
      </div>
    </div>
  );
};

export default Blog;
