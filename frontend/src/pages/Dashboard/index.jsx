import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { adminService } from '../../services/adminService';
import SecurityCard from '../../components/SecurityCard/SecurityCard';
import LoginChart from '../../components/Charts/LoginChart';
import SecurityChart from '../../components/Charts/SecurityChart';

// Generate mock chart data from login history
const buildLoginChartData = (history = []) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts = Array(7).fill(0);
  history.forEach((h) => {
    const d = new Date(h.createdAt).getDay();
    counts[d]++;
  });
  return days.map((day, i) => ({ date: day, logins: counts[i] }));
};

const buildAlertChartData = (alerts = []) => {
  const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const counts = {};
  severities.forEach((s) => (counts[s] = 0));
  alerts.forEach((a) => { if (counts[a.severity] !== undefined) counts[a.severity]++; });
  return severities.map((s) => ({ severity: s, count: counts[s] }));
};

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [adminStats, setAdminStats] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sessRes, histRes, alertRes] = await Promise.all([
          userService.getSessions(),
          userService.getLoginHistory({ limit: 20 }),
          userService.getSecurityAlerts(),
        ]);
        setSessions(sessRes.data?.sessions || []);
        setLoginHistory(histRes.data?.history || []);
        setAlerts(alertRes.data?.alerts || []);

        if (isAdmin) {
          const adminRes = await adminService.getDashboardStats();
          setAdminStats(adminRes.data?.stats);
        }
      } catch {
        // silent — show empty state
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [isAdmin]);

  const loginChartData = buildLoginChartData(loginHistory);
  const alertChartData = buildAlertChartData(alerts);

  const successLogins = loginHistory.filter((h) => h.status === 'SUCCESS').length;
  const failedLogins = loginHistory.filter((h) => h.status === 'FAILED').length;
  const unresolvedAlerts = alerts.filter((a) => !a.isResolved).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="section-title">
          Welcome back, <span className="text-gradient">{user?.firstName}</span> 👋
        </h1>
        <p className="section-subtitle">
          Here's your security overview for today — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Admin Stats (admin only) */}
      {isAdmin && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="badge badge-secondary">Admin Overview</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <SecurityCard icon="👥" value={adminStats?.totalUsers} label="Total Users" color="cyan" loading={loading} />
            <SecurityCard icon="✅" value={adminStats?.verifiedUsers} label="Verified Users" color="green" loading={loading} />
            <SecurityCard icon="🔒" value={adminStats?.activeSessions} label="Active Sessions" color="purple" loading={loading} />
            <SecurityCard icon="⚠️" value={adminStats?.criticalAlerts} label="Critical Alerts" color="red" loading={loading} />
          </div>
        </div>
      )}

      {/* Personal Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SecurityCard
          icon="💻"
          value={sessions.length}
          label="Active Sessions"
          sublabel="Across all devices"
          color="cyan"
          loading={loading}
        />
        <SecurityCard
          icon="✅"
          value={successLogins}
          label="Successful Logins"
          sublabel="Last 20 events"
          color="green"
          loading={loading}
        />
        <SecurityCard
          icon="❌"
          value={failedLogins}
          label="Failed Attempts"
          sublabel="Last 20 events"
          color={failedLogins > 0 ? 'red' : 'green'}
          loading={loading}
        />
        <SecurityCard
          icon="🚨"
          value={unresolvedAlerts}
          label="Security Alerts"
          sublabel="Unresolved"
          color={unresolvedAlerts > 0 ? 'red' : 'green'}
          loading={loading}
        />
      </div>

      {/* MFA Badge */}
      {!user?.mfaEnabled && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="alert alert-warning"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <strong>Enhance your security!</strong> Multi-Factor Authentication is not enabled on your account.
          </div>
          <Link to="/security" className="btn btn-warning btn-sm flex-shrink-0" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
            Enable MFA →
          </Link>
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-white">Login Activity</h2>
              <p className="text-dark-400 text-xs mt-0.5">Logins per day this week</p>
            </div>
            <span className="badge badge-primary">7 Days</span>
          </div>
          <LoginChart data={loginChartData} />
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-white">Security Alerts</h2>
              <p className="text-dark-400 text-xs mt-0.5">Alerts by severity level</p>
            </div>
            <span className="badge badge-danger">{unresolvedAlerts} Active</span>
          </div>
          <SecurityChart data={alertChartData} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-dark-700/30">
          <h2 className="font-bold text-white">Recent Login Activity</h2>
          <Link to="/login-history" className="text-primary-400 text-sm hover:text-primary-300 transition-colors">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : loginHistory.length === 0 ? (
            <div className="p-8 text-center text-dark-400 text-sm">No login history found.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>IP Address</th>
                  <th>Device</th>
                  <th>Browser</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.slice(0, 6).map((h, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`badge ${h.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}`}>
                        {h.status === 'SUCCESS' ? '✓' : '✗'} {h.status}
                      </span>
                    </td>
                    <td className="font-mono text-xs">{h.ipAddress || '—'}</td>
                    <td className="text-xs">{h.deviceInfo?.device || 'Desktop'}</td>
                    <td className="text-xs">{h.deviceInfo?.browser || '—'}</td>
                    <td className="text-xs text-dark-400">{new Date(h.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { to: '/profile', icon: '👤', label: 'Edit Profile' },
          { to: '/security', icon: '🔐', label: 'Setup MFA' },
          { to: '/sessions', icon: '💻', label: 'Manage Sessions' },
          { to: '/login-history', icon: '📋', label: 'Audit Logs' },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="card-hover p-4 text-center flex flex-col items-center gap-2 group">
            <span className="text-2xl">{item.icon}</span>
            <span className="text-sm text-dark-200 group-hover:text-white transition-colors">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
