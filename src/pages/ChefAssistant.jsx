import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Plus, Trash2, ChefHat, History, Loader2, List, BookOpen, ChevronLeft, Sparkles, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useConfig } from '../context/ConfigContext';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
import FallingFood from '../components/FallingFood';
import AIModelPills from '../components/AIModelPills';
import OpenAI from 'openai';

const ChefAssistant = () => {
    const navigate = useNavigate();
    const { config } = useConfig();
    const currentUser = auth.currentUser;
    const [ingredients, setIngredients] = useState([{ id: Date.now(), name: '', quantity: '', unit: '' }]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recipes, setRecipes] = useState([]); 
    const [selectedRecipe, setSelectedRecipe] = useState(null); 
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedModel, setSelectedModel] = useState('gemini');

    const geminiKey = config?.integrations?.geminiKey || import.meta.env.VITE_GEMINI_API_KEY;
    const deepseekKey = config?.integrations?.deepseekKey || import.meta.env.VITE_DEEPSEEK_API_KEY;
    const groqKey = config?.integrations?.groqKey;

    const genAI = new GoogleGenerativeAI(geminiKey || 'dummy_key');
    const deepseek = new OpenAI({ apiKey: deepseekKey || 'dummy_key', baseURL: 'https://api.deepseek.com', dangerouslyAllowBrowser: true });
    const groq = groqKey ? new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1', dangerouslyAllowBrowser: true }) : null;

    // Load History
    useEffect(() => {
        if (!currentUser) return;
        const historyRef = collection(db, 'users', currentUser.uid, 'recipes_history');
        const q = query(historyRef, orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [currentUser]);

    const addIngredientRow = () => {
        setIngredients([...ingredients, { id: Date.now(), name: '', quantity: '', unit: '' }]);
    };

    const inferUnit = async (id, foodName) => {
        if (!foodName || foodName.length < 2) return;
        
        try {
            const prompt = `Bạn là một đầu bếp chuyên nghiệp. Hãy gợi ý 1 đơn vị đo lường SIÊU NGẮN GỌN và CHÍNH XÁC nhất (ví dụ: quả, cái, bó, gram, ml, lát, muỗng) cho thực phẩm: "${foodName}". 
            QUY TẮC LOGIC:
            - Trứng -> quả hoặc cái.
            - Rau -> bó hoặc gram.
            - Nước/Chất lỏng -> ml hoặc lít.
            - Thịt -> gram hoặc kg.
            Chỉ trả về đúng 1 từ duy nhất là đơn vị đó. Không thêm bất kỳ ký tự nào khác.`;
            
            let unitResult = '';
            if (config?.integrations?.groqKey) {
                const completion = await groq.chat.completions.create({ 
                    model: "llama-3.1-8b-instant", 
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 10
                });
                unitResult = completion.choices[0].message.content.trim().toLowerCase().replace(/\./g, '');
            } else {
                const geminiKey = config?.integrations?.geminiKey || import.meta.env.VITE_GEMINI_API_KEY;
                const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                const data = await response.json();
                unitResult = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase().replace(/\./g, '') || '';
            }

            if (unitResult && unitResult.length < 15) {
                setIngredients(prev => prev.map(ing => {
                    if (ing.id === id && !ing.unit) {
                        return { ...ing, unit: unitResult };
                    }
                    return ing;
                }));
            }
        } catch (e) {
            console.error("Unit inference error:", e);
        }
    };

    const updateIngredient = (id, field, value) => {
        const newIngredients = ingredients.map(ing => {
            if (ing.id === id) {
                return { ...ing, [field]: value };
            }
            return ing;
        });

        // Auto-add new row if breathing into the last one
        const lastIng = newIngredients[newIngredients.length - 1];
        if (lastIng.name.trim() !== '' && field === 'name') {
            newIngredients.push({ id: Date.now(), name: '', quantity: '', unit: '' });
        }

        setIngredients(newIngredients);
    };

    const removeIngredient = (id) => {
        if (ingredients.length > 1) {
            setIngredients(ingredients.filter(ing => ing.id !== id));
        }
    };

    const handleGenerateRecipes = async () => {
        const activeIngredients = ingredients.filter(ing => ing.name.trim() !== '');
        if (activeIngredients.length === 0) {
            alert(t('chef.error_ingredients', 'Vui lòng nhập ít nhất một loại thực phẩm!'));
            return;
        }

        setIsProcessing(true);
        setRecipes([]);
        setSelectedRecipe(null);


        try {
            const ingredientList = activeIngredients.map(ing => `${ing.name} ${ing.quantity} ${ing.unit}`).join(', ');
            const prompt = `Tôi có các nguyên liệu sau: ${ingredientList}. Hãy gợi ý khoảng 3 món ăn ngon có thể nấu từ chúng. 
            Trả phí kết quả dưới định dạng JSON JSON_START { "recipes": [ { "name": "Tên món", "description": "Mô tả ngắn gọn", "instructions": "Cách nấu chi tiết theo từng bước", "ingredientsNeeded": "Các nguyên liệu cần dùng" } ] } JSON_END. Hãy chỉ gợi ý các món thực tiễn.`;

            let resultText = '';

            if (selectedModel === 'gemini') {
                const geminiKey = config?.integrations?.geminiKey || import.meta.env.VITE_GEMINI_API_KEY;
                const payload = { contents: [{ parts: [{ text: prompt }] }] };
                const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();
                resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lỗi phản hồi từ Gemini.";
            } else if (selectedModel === 'groq') {
                if (!groq) throw new Error('Chưa cấu hình Groq Key!');
                const completion = await groq.chat.completions.create({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }] });
                resultText = completion.choices[0].message.content;
            } else {
                const completion = await deepseek.chat.completions.create({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }] });
                resultText = completion.choices[0].message.content;
            }
            
            const jsonStr = resultText.match(/JSON_START([\s\S]*?)JSON_END/);
            if (jsonStr) {
                const data = JSON.parse(jsonStr[1]);
                setRecipes(data.recipes);
            } else {
                setRecipes([{ name: 'Kết quả gợi ý', instructions: resultText }]);
            }
        } catch (error) {
            console.error('AI Error:', error);
            alert('Đã có lỗi xảy ra khi gọi AI. Vui lòng kiểm tra API Key.');
        } finally {
            setIsProcessing(false);
        }
    };

    const saveToHistory = async (recipe) => {
        if (!currentUser) return;
        try {
            await addDoc(collection(db, 'users', currentUser.uid, 'recipes_history'), {
                name: recipe.name,
                instructions: recipe.instructions,
                timestamp: serverTimestamp(),
                ingredientsProvided: ingredients.filter(ing => ing.name).map(ing => ing.name).join(', ')
            });
        } catch (e) {
            console.error("Error saving recipe:", e);
        }
    };

    const { t } = useTranslation();

    return (
        <div className="utility-hub-container museum-theme" style={{ 
            padding: '6rem 5% 0', 
            minHeight: '100vh', 
            display: 'flex', 
            flexDirection: 'column', 
            overflowY: 'auto',
            background: 'transparent'
        }}>
            <FallingFood />
            <div className="museum-scanlines" style={{ opacity: 0.1 }} />
            
            <div className="container" style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', position: 'relative', zIndex: 5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <button onClick={() => navigate('/utilities')} className="back-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-main)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                        <ChevronLeft size={20} /> {t('nav.utilities')}
                    </button>
                    {currentUser && (
                        <button onClick={() => setShowHistory(!showHistory)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212, 175, 55, 0.2)', padding: '0.6rem 1.2rem', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>
                            <History size={18} /> {showHistory ? 'ẨN LỊCH SỬ' : 'LỊCH SỬ NẤU ĂN'}
                        </button>
                    )}
                </div>

                <div className="hub-header" style={{ textAlign: 'left', marginBottom: '1.5rem', border: 'none' }}>
                    <h1 style={{ fontSize: '2.5rem' }} className="text-gradient">{t('chef.title')}</h1>
                    <p>{t('chef.subtitle')}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: showHistory ? '300px 1fr 1fr' : '1fr 1fr', gap: '2rem', flex: 1, minHeight: 0, paddingBottom: '2rem' }}>
                    
                    {/* History Sidebar */}
                    {showHistory && (
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel" style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto', background: 'var(--bg-glass)', borderColor: 'rgba(212, 175, 55, 0.2)' }}>
                            <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginBottom: '1.5rem', color: 'var(--accent-gold)', letterSpacing: '2px' }}>RECIPE LOGS</h3>
                            {history.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Chưa có lịch sử.</p> : (
                                history.map(item => (
                                    <div key={item.id} onClick={() => setSelectedRecipe(item)} style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', hover: { background: 'rgba(255,255,255,0.02)' } }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(item.timestamp?.toDate()).toLocaleDateString()}</div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {/* Left: Input List */}
                    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: 'var(--bg-glass)', borderColor: 'rgba(212, 175, 55, 0.2)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        {/* Background Watermark */}
                        <Utensils size={300} style={{ position: 'absolute', top: '5%', right: '-10%', opacity: 0.04, color: 'var(--accent-main)', pointerEvents: 'none', transform: 'rotate(15deg)' }} />
                        <ChefHat size={250} style={{ position: 'absolute', bottom: '5%', left: '-5%', opacity: 0.04, color: 'var(--accent-main)', pointerEvents: 'none', transform: 'rotate(-10deg)' }} />

                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: 'var(--accent-gold)' }}>
                            <List size={24} /> <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>DANH SÁCH THỰC PHẨM</span>
                        </div>

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>CHỌN MODEL TRÍ TUỆ NHÂN TẠO</p>
                            <AIModelPills selectedModel={selectedModel} onModelChange={setSelectedModel} />
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '2rem', paddingRight: '0.5rem', position: 'relative', zIndex: 1, overflowX: 'hidden' }}>
                            {ingredients.map((ing, idx) => (
                                <motion.div key={ing.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.2rem', alignItems: 'center' }}>
                                    <input 
                                        type="text" 
                                        placeholder={t('chef.placeholder_name')}
                                        value={ing.name}
                                        onBlur={(e) => inferUnit(ing.id, e.target.value)}
                                        onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)}
                                        style={{ flex: 3, padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212, 175, 55, 0.1)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.95rem', transition: 'all 0.3s' }}
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Số lượng"
                                        value={ing.quantity}
                                        onChange={(e) => updateIngredient(ing.id, 'quantity', e.target.value)}
                                        style={{ flex: 1.2, padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212, 175, 55, 0.1)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.95rem', transition: 'all 0.3s' }}
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Đơn vị"
                                        value={ing.unit}
                                        onChange={(e) => updateIngredient(ing.id, 'unit', e.target.value)}
                                        style={{ flex: 1.5, padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212, 175, 55, 0.1)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.95rem', transition: 'all 0.3s' }}
                                    />
                                    <button onClick={() => removeIngredient(ing.id)} style={{ color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', opacity: ingredients.length > 1 ? 1 : 0, padding: '0.5rem' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>

                        <button 
                            className="btn-primary" 
                            onClick={handleGenerateRecipes}
                            disabled={isProcessing}
                            style={{ position: 'relative', zIndex: 1, width: '100%', justifyContent: 'center', gap: '0.8rem', padding: '1.2rem' }}
                        >
                            {isProcessing ? <Loader2 size={24} className="spin" /> : <ChefHat size={24} />}
                            {t('chef.btn_cook')}
                        </button>
                    </div>

                    {/* Right: AI Results */}
                    <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg-glass)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 15px rgba(0,0,0,0.1)' }}>
                         <AnimatePresence mode="wait">
                            {isProcessing ? (
                                <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                                    <div className="artifact-glow" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                                    <Loader2 size={64} className="spin" style={{ color: 'var(--accent-main)' }} />
                                    <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-main)' }}>AI ĐANG LÊN THỰC ĐƠN...</p>
                                </motion.div>
                            ) : selectedRecipe ? (
                                <motion.div key="recipe-detail" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ flex: 1 }}>
                                     <button onClick={() => { setSelectedRecipe(null); if (recipes.length === 0) setRecipes([]); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-secondary)', background: 'transparent', border: 'none', marginBottom: '2rem', cursor: 'pointer' }}>
                                        <ChevronLeft size={18} /> QUAY LẠI DANH SÁCH
                                     </button>
                                     <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', fontFamily: 'Chakra Petch' }}>{selectedRecipe.name}</h2>
                                     
                                     <div className="markdown-content" style={{ fontSize: '1rem', lineHeight: '1.8' }}>
                                        <div style={{ padding: '1.5rem', background: 'rgba(var(--accent-rgb), 0.05)', borderRadius: '8px', marginBottom: '2rem', borderLeft: '4px solid var(--accent-main)' }}>
                                            <strong>Nguyên liệu cần:</strong><br /> {selectedRecipe.ingredientsNeeded}
                                        </div>
                                        <ReactMarkdown>{selectedRecipe.instructions}</ReactMarkdown>
                                     </div>

                                     {currentUser && !selectedRecipe.id && (
                                         <button 
                                            onClick={() => { saveToHistory(selectedRecipe); alert('Đã lưu vào lịch sử!'); }}
                                            style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-main)', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                                        >
                                            <Save size={18} /> LƯU CÔNG THỨC
                                         </button>
                                     )}
                                </motion.div>
                            ) : recipes.length > 0 ? (
                                <motion.div key="recipe-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', color: 'var(--accent-secondary)' }}>
                                        <Sparkles size={24} /> <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>GỢI Ý CỦA BCT CHEF</span>
                                    </div>
                                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                                        {recipes.map((r, i) => (
                                            <div key={i} className="utility-card" onClick={() => setSelectedRecipe(r)} style={{ height: 'auto', padding: '1.5rem', cursor: 'pointer' }}>
                                                <h4 style={{ fontSize: '1.2rem', color: 'var(--accent-main)', marginBottom: '0.5rem' }}>{r.name}</h4>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{r.description}</p>
                                                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-secondary)', fontSize: '0.8rem' }}>
                                                    <BookOpen size={14} /> XEM CÔNG THỨC
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                                    <ChefHat size={80} />
                                    <p style={{ marginTop: '1.5rem', fontFamily: 'var(--font-mono)' }}>NHẬP THỰC PHẨM ĐỂ BẮT ĐẦU</p>
                                </div>
                            )}
                         </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChefAssistant;
