import React from 'react';
import { motion } from 'framer-motion';

/**
 * Animated loading spinner.
 * @param {boolean} fullScreen - If true, renders full-screen centered overlay
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} text - Optional loading text
 */
const Loader = ({ fullScreen = false, size = 'md', text = 'Loading...' }) => {
  const sizeMap = {
    sm: { outer: 'w-8 h-8', inner: 'w-5 h-5', border: 'border-2' },
    md: { outer: 'w-14 h-14', inner: 'w-9 h-9', border: 'border-2' },
    lg: { outer: 'w-20 h-20', inner: 'w-14 h-14', border: 'border-3' },
  };

  const dims = sizeMap[size] || sizeMap.md;

  const spinner = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {/* Outer ring */}
        <div
          className={`${dims.outer} rounded-full border-2 border-primary-500/20`}
        />
        {/* Spinning arc */}
        <div
          className={`${dims.outer} rounded-full border-2 border-transparent border-t-primary-500 animate-spin absolute inset-0`}
        />
        {/* Inner glow ring */}
        <div
          className={`${dims.inner} rounded-full border-2 border-secondary-500/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
        />
        <div
          className={`${dims.inner} rounded-full border-2 border-transparent border-b-secondary-500 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
          style={{ animationDirection: 'reverse', animationDuration: '0.7s' }}
        />

        {/* Center shield icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-primary-400 animate-pulse-slow">
            <path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.25C17.25 23.15 21 18.25 21 13V7L12 2z" fill="currentColor" opacity="0.8"/>
          </svg>
        </div>
      </div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-dark-300 text-sm font-medium tracking-wide"
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-dark-950 flex items-center justify-center z-50">
        <div className="absolute inset-0 cyber-grid-bg opacity-20" />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-10"
        >
          {spinner}
        </motion.div>
      </div>
    );
  }

  return spinner;
};

export default Loader;
