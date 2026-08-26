import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const currentScroll = window.scrollY;
        setScrollProgress((currentScroll / totalScroll) * 100);
        setIsVisible(currentScroll > 300);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once initially to check scroll position
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // SVG parameters for progress circle
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 flex items-center justify-center bg-[#0e0d0b] border border-white/10 text-luxury-gold hover:text-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.35)] cursor-pointer focus:outline-none transition-colors duration-200"
          aria-label="Scroll to top"
        >
          {/* Circular Progress SVG */}
          <svg className="absolute w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r={radius}
              className="stroke-white/10"
              strokeWidth="2.5"
              fill="transparent"
            />
            <motion.circle
              cx="24"
              cy="24"
              r={radius}
              className="stroke-luxury-gold"
              strokeWidth="2.5"
              fill="transparent"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ ease: 'easeOut', duration: 0.1 }}
            />
          </svg>

          {/* Arrow Icon */}
          <ArrowUp size={18} className="relative z-10" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
