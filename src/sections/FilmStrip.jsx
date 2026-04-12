import React from 'react';
import './FilmStrip.css';
import { useConfig } from '../context/ConfigContext';

const FilmStrip = () => {
  const { config } = useConfig();
  const images = config?.content?.filmStripImages || [];
  const speed = config?.content?.filmStripSpeed || 45;
  
  if (images.length === 0) return null;
  // Bọc ảnh liên tiếp nhau để chạy ngang vô tận
  const duplicatedImages = [...images, ...images, ...images];

  return (
    <section className="film-strip-container">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: '2.5rem', letterSpacing: '2px', color: 'var(--text-primary)' }}>KỸ THUẬT SỐ & KÝ ỨC</h2>
        <p style={{ color: 'var(--text-muted)' }}>Những lăng kính thời gian lưu giữ hành trình</p>
      </div>
      <div className="film-marquee-wrapper">
        <div className="film-marquee" style={{ animationDuration: `${speed}s` }}>
          {duplicatedImages.map((src, index) => {
            const isVideo = src?.match(/\.(mp4|webm|ogg|mov)$|^data:video/i);
            return (
              <div className="film-frame" key={index}>
                {isVideo ? (
                  <video src={src} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={src} alt={`Ký ức ${index}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FilmStrip;
