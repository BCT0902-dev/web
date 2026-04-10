import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const quotes = [
  "Không có gì quý hơn độc lập, tự do. - Hồ Chí Minh",
  "Vì lợi ích mười năm thì phải trồng cây, vì lợi ích trăm năm thì phải trồng người. - Hồ Chí Minh",
  "Đoàn kết, đoàn kết, đại đoàn kết. Thành công, thành công, đại thành công. - Hồ Chí Minh",
  "Dễ mười lần không dân cũng chịu, khó trăm lần dân liệu cũng xong. - Hồ Chí Minh",
  "Có tài mà không có đức là người vô dụng, có đức mà không có tài thì làm việc gì cũng khó. - Hồ Chí Minh",
  "Học hỏi là việc phải tiếp tục suốt đời. - Hồ Chí Minh",
  "Cần, Kiệm, Liêm, Chính, Chí công vô tư. - Hồ Chí Minh",
  "Nước Việt Nam là một, dân tộc Việt Nam là một. - Hồ Chí Minh",
  "Mỗi người tốt, mỗi việc tốt là một bông hoa đẹp, cả dân tộc ta là một rừng hoa đẹp. - Hồ Chí Minh",
  "Tôi chỉ có một sự ham muốn, ham muốn tột bậc, là làm sao cho nước ta được độc lập toàn diện. - Hồ Chí Minh"
];

const QuoteCarousel = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ height: '80px', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ 
            fontSize: '1.2rem', 
            color: 'var(--text-muted)', 
            fontStyle: 'italic',
            lineHeight: 1.6,
            maxWidth: '600px',
            position: 'absolute'
          }}
        >
          "{quotes[index]}"
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

export default QuoteCarousel;
