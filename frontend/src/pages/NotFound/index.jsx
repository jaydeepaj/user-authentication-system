import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 cyber-grid-bg opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-secondary-500/5 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 scanline pointer-events-none" />

      <div className="relative z-10 text-center max-w-md">
        {/* 404 Number */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <span
            className="text-[10rem] font-black leading-none tracking-tighter select-none"
            style={{
              background: 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(159,122,234,0.15))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: 'none',
              filter: 'drop-shadow(0 0 30px rgba(0,240,255,0.2))',
            }}
          >
            404
          </span>
        </motion.div>

        {/* Shield icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-danger-500/10 border border-danger-500/20 flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-danger-400">
            <path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.25C17.25 23.15 21 18.25 21 13V7L12 2z" fill="currentColor" opacity="0.2"/>
            <path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.25C17.25 23.15 21 18.25 21 13V7L12 2z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-white mb-3"
        >
          Access Point Not Found
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-dark-300 text-sm mb-8 leading-relaxed"
        >
          The route you're trying to reach doesn't exist or has been moved.
          All access attempts are logged for security purposes.
        </motion.p>

        {/* Glowing line */}
        <div className="glow-line mb-8" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <button
            id="not-found-back-btn"
            onClick={() => navigate(-1)}
            className="btn btn-ghost"
          >
            ← Go Back
          </button>
          <Link to="/" className="btn btn-primary">
            Return Home
          </Link>
          <Link to="/dashboard" className="btn btn-outline">
            Dashboard
          </Link>
        </motion.div>

        {/* Error code */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 font-mono text-dark-600 text-xs"
        >
          ERROR_CODE: ROUTE_NOT_FOUND | STATUS: 404 | LOGGED: TRUE
        </motion.p>
      </div>
    </div>
  );
};

export default NotFound;
