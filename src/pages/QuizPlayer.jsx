import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';

const QuizPlayer = () => {
    const { slug } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const q = query(collection(db, 'quizzes'), where('slug', '==', slug));
                const snapshot = await getDocs(q);
                if (snapshot.empty) {
                    setError('Không tìm thấy bài thi hoặc bài thi đã bị xóa!');
                } else {
                    const data = snapshot.docs[0].data();
                    
                    // Check Deadline
                    if (data.config.expiryDate) {
                        const now = new Date();
                        const expiry = new Date(data.config.expiryDate);
                        if (now > expiry) {
                            setError('Bài thi này đã kết thúc vào lúc ' + expiry.toLocaleString('vi-VN'));
                        }
                    }
                    
                    setQuiz(data);
                }
            } catch (err) {
                console.error(err);
                setError('Lỗi kết nối máy chủ!');
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [slug]);

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>Đang tải bài thi...</div>;
    
    if (error) return (
        <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ef4444' }}>
            <h2>{error}</h2>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', padding: '6rem 2rem', background: '#000', color: '#fff', fontFamily: 'var(--font-primary)' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '800px', margin: '0 auto', background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                {quiz.config.bannerUrl && (
                    <img src={quiz.config.bannerUrl} alt="Banner" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '2rem' }} />
                )}
                <h1 style={{ color: 'var(--accent-main)', textAlign: 'center', fontSize: '2rem', marginBottom: '1rem' }}>{quiz.config.title}</h1>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>{quiz.config.description}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                    <div>
                        <strong style={{ color: 'var(--accent-secondary)' }}>Thời gian:</strong> {quiz.config.timeLimit} phút
                    </div>
                    <div>
                        <strong style={{ color: 'var(--accent-secondary)' }}>Số câu hỏi:</strong> {quiz.config.questionsCount} câu
                    </div>
                    <div>
                        <strong style={{ color: 'var(--accent-secondary)' }}>Người tạo:</strong> {quiz.creatorName}
                    </div>
                    <div>
                        <strong style={{ color: 'var(--accent-secondary)' }}>Hình thức:</strong> {quiz.config.isScored ? 'Chấm điểm' : 'Không chấm điểm'}
                    </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <button 
                      disabled={!!error}
                      style={{ 
                        padding: '1rem 3rem', 
                        fontSize: '1.2rem', 
                        fontWeight: 'bold', 
                        background: error ? 'rgba(255,255,255,0.1)' : 'var(--accent-main)', 
                        color: error ? '#666' : '#000', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: error ? 'not-allowed' : 'pointer', 
                        fontFamily: 'var(--font-tech)' 
                      }}
                    >
                        {error ? 'ĐÃ KẾT THÚC' : 'BẮT ĐẦU LÀM BÀI'}
                    </button>
                    <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {error ? '' : '* Tính năng làm bài đang được hoàn thiện ở Giai đoạn 2'}
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default QuizPlayer;
