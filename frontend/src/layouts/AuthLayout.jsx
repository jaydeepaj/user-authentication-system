import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CyberShield from '../components/CyberIllustration/CyberShield';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex bg-dark-900 overflow-hidden relative">
      {/* Aurora overlays for depth */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* ── Left Panel — Cyberpunk Visual ──────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-between p-12 overflow-hidden border-r border-dark-800 bg-dark-950/80 backdrop-blur-md">
        {/* Animated background grid */}
        <div className="absolute inset-0 cyber-grid-bg opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-950/20 to-dark-950 pointer-events-none" />

        {/* Scanline effect */}
        <div className="absolute inset-0 scanline pointer-events-none opacity-40" />

        {/* Logo (Top aligned) */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full text-left"
        >
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-glow-cyan">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-dark-900">
                <path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.25C17.25 23.15 21 18.25 21 13V7L12 2z" fill="currentColor" opacity="0.9"/>
                <path d="M9 12l2 2 4-4" stroke="#0c101b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xl font-black tracking-wider text-gradient">SECUREAUTH X</span>
          </Link>
        </motion.div>

        {/* Cyber Security Visualization (Centered) */}
        <div className="flex flex-col items-center justify-center flex-1 w-full max-w-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <CyberShield />
          </motion.div>

          <div className="text-center mt-4">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-3xl font-extrabold text-white mb-3 tracking-tight"
            >
              Enterprise-Grade
              <br />
              <span className="text-gradient">Identity Security</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-dark-300 text-sm leading-relaxed"
            >
              Zero-Trust identity verification platform with multi-factor authorization, dynamic JWT rotation, and network threat defense.
            </motion.p>
          </div>
        </div>

        {/* Zero-Trust indicator tags (Bottom aligned) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex justify-between items-center w-full max-w-md bg-dark-900/50 border border-dark-800 p-3 rounded-2xl"
        >
          <div className="flex gap-4">
            <span className="text-xs text-dark-300 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-ping" />
              MFA ENABLED
            </span>
            <span className="text-xs text-dark-300 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
              JWT ROTATION
            </span>
          </div>
          <span className="text-xs text-dark-500 font-mono">V1.0.0</span>
        </motion.div>
      </div>

      {/* ── Right Panel — Form Area ─────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 min-h-screen overflow-y-auto z-10 bg-dark-900/30">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-dark-900">
                <path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.25C17.25 23.15 21 18.25 21 13V7L12 2z" fill="currentColor"/>
                <path d="M9 12l2 2 4-4" stroke="#0c101b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-gradient">SecureAuth X</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md glass-card p-8 border border-white/5 shadow-card"
        >
          <Outlet />
        </motion.div>

        <p className="mt-8 text-dark-400 text-xs text-center font-mono">
          © {new Date().getFullYear()} SECUREAUTH X. SYSTEM SECURED BY ZERO-TRUST.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
