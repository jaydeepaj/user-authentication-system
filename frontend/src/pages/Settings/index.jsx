import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import useAuth from '../../hooks/useAuth';

const Settings = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    loginAlerts: true,
    securityAlerts: true,
    sessionExpiry: false,
    weeklyReport: false,
  });
  const [saved, setSaved] = useState(false);

  const handleToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="section-subtitle">Customize your SecureAuth X experience and notification preferences</p>
      </div>

      {saved && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="alert alert-success">
          ✅ Settings saved successfully.
        </motion.div>
      )}

      {/* Appearance */}
      <div className="card p-6">
        <h2 className="font-semibold text-white mb-5">Appearance</h2>
        <div className="flex items-center justify-between py-3 border-b border-dark-700/30">
          <div>
            <p className="text-white text-sm font-medium">Color Theme</p>
            <p className="text-dark-400 text-xs mt-0.5">Switch between dark and light mode</p>
          </div>
          <button
            id="settings-theme-toggle"
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full border transition-all duration-300 ${
              isDark ? 'bg-primary-500/20 border-primary-500/40' : 'bg-warning-500/20 border-warning-500/40'
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center text-sm shadow-md ${
                isDark
                  ? 'left-0.5 bg-dark-900 border border-primary-500/50'
                  : 'left-7 bg-white border border-warning-500/50'
              }`}
            >
              {isDark ? '🌙' : '☀️'}
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between py-3 pt-4">
          <div>
            <p className="text-white text-sm font-medium">Current Theme</p>
            <p className="text-dark-400 text-xs mt-0.5">{isDark ? 'Dark mode (default)' : 'Light mode'}</p>
          </div>
          <span className={`badge ${isDark ? 'badge-primary' : 'badge-warning'}`}>
            {isDark ? '🌙 Dark' : '☀️ Light'}
          </span>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <h2 className="font-semibold text-white mb-5">Notification Preferences</h2>
        <div className="space-y-4">
          {[
            { key: 'loginAlerts', label: 'Login Alerts', desc: 'Get notified of new logins to your account' },
            { key: 'securityAlerts', label: 'Security Alerts', desc: 'Receive alerts for suspicious activity' },
            { key: 'sessionExpiry', label: 'Session Expiry Warnings', desc: 'Warn before your session expires' },
            { key: 'weeklyReport', label: 'Weekly Security Report', desc: 'Weekly summary of account activity' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-dark-700/30 last:border-0">
              <div>
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-dark-400 text-xs mt-0.5">{desc}</p>
              </div>
              <button
                id={`settings-notif-${key}`}
                onClick={() => handleToggle(key)}
                className={`relative w-10 h-5.5 rounded-full transition-all duration-300 ${
                  notifications[key] ? 'bg-primary-500' : 'bg-dark-600'
                }`}
                style={{ height: '22px', width: '40px' }}
                role="switch"
                aria-checked={notifications[key]}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                    notifications[key] ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
        <button id="settings-save-btn" onClick={handleSave} className="btn btn-primary btn-sm mt-5">Save Preferences</button>
      </div>

      {/* Account Info */}
      <div className="card p-6">
        <h2 className="font-semibold text-white mb-5">Account Information</h2>
        <div className="space-y-3">
          {[
            { label: 'Account ID', value: user?._id || user?.id, mono: true },
            { label: 'Email', value: user?.email, mono: true },
            { label: 'Platform', value: 'SecureAuth X v1.0.0' },
            { label: 'API Version', value: '1.0.0' },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-dark-700/30 last:border-0">
              <span className="text-dark-400 text-sm">{label}</span>
              <span className={`text-white text-sm ${mono ? 'font-mono text-xs' : 'font-medium'} truncate max-w-xs`}>{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div className="card p-6">
        <h2 className="font-semibold text-white mb-4">Privacy & Data</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-dark-800/60 rounded-xl border border-dark-600/40">
            <span className="text-xl">📊</span>
            <div>
              <p className="text-white text-sm font-medium">Data Retention</p>
              <p className="text-dark-400 text-xs mt-1">Login history and audit logs are retained for 90 days. Sessions expire after 7 days of inactivity.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-dark-800/60 rounded-xl border border-dark-600/40">
            <span className="text-xl">🔐</span>
            <div>
              <p className="text-white text-sm font-medium">Encryption</p>
              <p className="text-dark-400 text-xs mt-1">All passwords are hashed with bcrypt (factor 12). Tokens use RS256 signed JWTs. Cookies are HTTP-only and Secure.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
