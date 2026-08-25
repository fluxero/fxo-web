import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const Splash: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'done'>('loading');

  useEffect(() => {
    let v = 0;
    const id = setInterval(() => {
      v += Math.random() * 14 + 3;
      if (v >= 100) {
        v = 100;
        clearInterval(id);
        setPhase('done');
        setTimeout(onDone, 700);
      }
      setPct(Math.min(100, Math.round(v)));
    }, 70);
    return () => clearInterval(id);
  }, [onDone]);

  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#070608' }}
    >
      {/* Logo */}
      <div className="relative z-10 flex flex-row items-center gap-4 mb-10">
        <div className="relative flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full blur-2xl"
            style={{
              background:
                'radial-gradient(circle, rgba(0,214,143,0.3) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          >
            <img
              src="/fluxero-logo.svg"
              alt="Fluxero"
              style={{
                display: 'block',
                width: 'min(72vw, 360px)',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Status label */}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="relative z-10 font-mono uppercase tracking-[0.38em] text-[11px] mb-5"
        style={{ color: 'rgba(96,165,250,0.5)' }}
      >
        {phase === 'done' ? 'Systems Ready' : 'Initializing'}
      </motion.p>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0.7 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative z-10 w-52"
        style={{ height: 2 }}
      >
        {/* Track */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        />
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #00A86B, #00D68F, #00E5B8)',
            boxShadow: '0 0 14px rgba(0,214,143,0.75)',
            transition: 'width 0.08s ease',
          }}
        />
        {/* Glowing tip */}
        <div
          style={{
            position: 'absolute',
            top: -3,
            left: `calc(${pct}% - 3px)`,
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'white',
            boxShadow: '0 0 10px rgba(255,255,255,0.9), 0 0 22px rgba(96,165,250,0.7)',
            transition: 'left 0.08s ease',
          }}
        />
      </motion.div>

      {/* Percentage counter */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 font-mono text-[11px] mt-4 tabular-nums"
        style={{ color: '#00D68F', letterSpacing: '0.12em' }}
      >
        {pct}%
      </motion.p>
    </motion.div>
  );
};

