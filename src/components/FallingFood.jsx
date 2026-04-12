import React from 'react';
import { motion } from 'framer-motion';

const FoodItem = ({ delay }) => {
  const randomXInit = Math.random() * 100;
  const randomDuration = 10 + Math.random() * 20;
  const randomScale = 0.8 + Math.random() * 1.5;
  const foodEmojis = ['🍅', '🍳', '🥩', '🥦', '🍕', '🥗', '🥢', '🍷', '🥖', '🥕', '🥔'];
  const food = foodEmojis[Math.floor(Math.random() * foodEmojis.length)];

  return (
    <motion.div
      initial={{ 
        top: '-10%', 
        left: `${randomXInit}%`, 
        opacity: 0, 
        rotate: 0,
        scale: randomScale 
      }}
      animate={{ 
        top: '110%', 
        left: [`${randomXInit}%`, `${randomXInit + (Math.random() > 0.5 ? 15 : -15)}%`, `${randomXInit}%`],
        opacity: [0, 0.5, 0.5, 0],
        rotate: [0, 180, 360, 540, 720],
      }}
      transition={{ 
        duration: randomDuration, 
        repeat: Infinity, 
        delay: delay,
        ease: "linear"
      }}
      style={{
        position: 'absolute',
        fontSize: '2rem',
        filter: 'blur(1px)',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    >
      {food}
    </motion.div>
  );
};

const FallingFood = () => {
  const foodCount = 20;
  const foods = Array.from({ length: foodCount });

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 0,
      overflow: 'hidden'
    }}>
      {foods.map((_, i) => (
        <FoodItem key={i} delay={i * 1.5} />
      ))}
    </div>
  );
};

export default FallingFood;
