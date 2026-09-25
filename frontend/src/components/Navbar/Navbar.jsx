import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';

const Navbar = ({ onMenuClick }) => {
  const { user, logoutUser, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const dropRef = useRef(null);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
      setDropdownOpen(false);
    }
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-20 bg-dark-900/80 backdrop-blur-md border-b border-dark-700/50 h-16 flex items-center px-4 sm:px-6 gap-4">
      {/* Mobile menu button */}
      <button
        id="nav-menu-toggle"
        onClick={onMenuClick}
        className="lg:hidden btn-icon btn-ghost text-dark-300 hover:text-white"
        aria-label="Open sidebar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Page title area — flex grow */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme toggle */}
        <button
          id="nav-theme-toggle"
          onClick={toggleTheme}
          className="btn-icon btn-ghost text-dark-300 hover:text-primary-400 transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>

        {/* Security indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success-500/10 border border-success-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse-slow" />
          <span className="text-success-400 text-xs font-medium">Secure</span>
        </div>

        {/* User menu */}
        <div className="relative" ref={dropRef}>
          <button
            id="nav-user-menu"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-dark-700/60 transition-all duration-200"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-dark-900 text-xs font-bold shadow-glow-sm">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-white leading-none">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-dark-400 mt-0.5">{user?.role}</p>
            </div>
            <svg className={`w-3.5 h-3.5 text-dark-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 card border-dark-600/50 shadow-card-hover z-50 py-1"
              >
                {/* User info */}
                <div className="px-4 py-3 border-b border-dark-700/50">
                  <p className="text-sm font-semibold text-white">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-dark-400 truncate">{user?.email}</p>
                </div>

                {/* Links */}
                {[
                  { to: '/profile', icon: '👤', label: 'Profile' },
                  { to: '/security', icon: '🔐', label: 'Security' },
                  { to: '/settings', icon: '⚙️', label: 'Settings' },
                  ...(isAdmin ? [{ to: '/admin', icon: '🛡️', label: 'Admin Panel' }] : []),
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-200 hover:bg-dark-700/60 hover:text-white transition-colors"
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}

                <div className="border-t border-dark-700/50 mt-1" />

                <button
                  id="nav-logout-btn"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-400 hover:bg-danger-500/10 transition-colors"
                >
                  <span>🚪</span>
                  {isLoggingOut ? 'Logging out...' : 'Sign Out'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
