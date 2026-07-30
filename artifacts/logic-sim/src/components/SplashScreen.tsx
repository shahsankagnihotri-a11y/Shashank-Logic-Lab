import { motion } from 'framer-motion';
import { useEffect } from 'react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const text = "SHASHANK LOGIC LABS".split("");
  
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050a0f] overflow-hidden"
    >
      <div className="scanline-overlay" />
      <div className="scanline-bar" />
      
      {/* Animated PCB Traces */}
      <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <motion.path
          d="M 0 100 L 200 100 L 250 150 L 500 150 M 1000 800 L 800 800 L 700 700 L 200 700"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeDasharray="1000"
          initial={{ strokeDashoffset: 1000 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        <motion.path
          d="M 100 0 L 100 200 L 150 250 L 150 500 M 800 1000 L 800 600 L 750 550 L 500 550"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeDasharray="1000"
          initial={{ strokeDashoffset: 1000 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
        />
      </svg>

      <div className="relative z-10 text-center">
        <div className="flex justify-center mb-4">
          {text.map((char, index) => (
            <motion.span
              key={index}
              className="text-4xl md:text-6xl lg:text-7xl font-bold neon-text tracking-widest"
              initial={{ opacity: 0, y: -50, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                type: "spring", 
                damping: 12, 
                stiffness: 100, 
                delay: index * 0.05 
              }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mono text-primary/70 text-sm md:text-base mt-2 tracking-wide font-medium"
        >
          Digital Logic Simulator · KLE Polytechnic, Hubli
        </motion.p>
      </div>
    </motion.div>
  );
}
