import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Quote, Star } from 'lucide-react';

const Testimonials = () => {
  const { t } = useTranslation();

  const testimonials = [
    {
      id: 1,
      name: "Alex Johnson",
      role: "Senior Developer @ TechCorp",
      content: "IRIS AI has completely transformed how our team approaches debugging. The Chef Assistant logic for dependencies is a game changer.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      stars: 5
    },
    {
      id: 2,
      name: "Sarah Chen",
      role: "UI/UX Designer",
      content: "The aesthetic of the IRIS ecosystem is unparalleled. It's rare to see an AI suite that looks as good as it performs.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      stars: 5
    },
    {
      id: 3,
      name: "Marco Rossi",
      role: "E-learning Specialist",
      content: "Youtube Smart Analyzer saved me hundreds of hours of manual transcription. Accurate, fast, and incredibly intuitive.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marco",
      stars: 5
    }
  ];

  return (
    <section id="testimonials" style={{ padding: '6rem 2rem', background: 'transparent', position: 'relative', overflow: 'hidden' }}>
      <div className="container">
        <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
             <h2 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem', fontFamily: 'Chakra Petch' }}>
                {t('testimonials.title', 'TRUSTED BY INNOVATORS')}
             </h2>
             <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                {t('testimonials.subtitle', 'What people are saying about their IRIS AI experience.')}
             </p>
          </motion.div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {testimonials.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="glass-panel"
              style={{ padding: '2.5rem', position: 'relative' }}
            >
              <Quote size={40} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', opacity: 0.1, color: 'var(--accent-main)' }} />
              
              <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '1.5rem' }}>
                {[...Array(item.stars)].map((_, i) => <Star key={i} size={16} fill="var(--accent-main)" color="var(--accent-main)" />)}
              </div>

              <p style={{ fontStyle: 'italic', marginBottom: '2rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                "{item.content}"
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src={item.avatar} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '2px solid var(--accent-main)' }} />
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700 }}>{item.name}</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
