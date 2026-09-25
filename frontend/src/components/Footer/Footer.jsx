import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-dark-700/30 bg-dark-900/50 py-4 px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-dark-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-dark-900">
              <path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.25C17.25 23.15 21 18.25 21 13V7L12 2z" fill="currentColor"/>
            </svg>
          </div>
          <span>© {new Date().getFullYear()} SecureAuth X. Enterprise Security Platform.</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse-slow" />
            All systems operational
          </span>
          <span className="text-dark-600">|</span>
          <Link to="/" className="hover:text-primary-400 transition-colors">Home</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
