import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '../../services/adminService';
import SecurityCard from '../../components/SecurityCard/SecurityCard';
import UserGrowthChart from '../../components/Charts/UserGrowthChart';
import Loader from '../../components/Loader/Loader';

// ─── Tab IDs ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'sessions', label: 'Sessions', icon: '💻' },
  { id: 'alerts', label: 'Alerts', icon: '🚨' },
  { id: 'audit', label: 'Audit Log', icon: '📋' },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboardStats().then((res) => {
      setStats(res.data?.stats);
    }).catch(() => {}).finally(() => setStatsLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="section-title">Admin Panel</h1>
          <span className="badge badge-secondary">Admin Only</span>
        </div>
        <p className="section-subtitle">Platform-wide user management, security monitoring, and audit logs</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SecurityCard icon="👥" value={stats?.totalUsers} label="Total Users" color="cyan" loading={statsLoading} />
        <SecurityCard icon="✅" value={stats?.verifiedUsers} label="Verified" color="green" loading={statsLoading} />
        <SecurityCard icon="🔒" value={stats?.activeSessions} label="Active Sessions" color="purple" loading={statsLoading} />
        <SecurityCard icon="🚨" value={stats?.criticalAlerts} label="Critical Alerts" color="red" loading={statsLoading} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-dark-800/60 border border-dark-600/50 rounded-xl overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`admin-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'sessions' && <SessionsTab />}
          {activeTab === 'alerts' && <AlertsTab />}
          {activeTab === 'audit' && <AuditTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ─── Users Tab ─────────────────────────────────────────────────────────────────
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchUsers = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getAllUsers({ page: p, limit: 10, search, role });
      setUsers(res.data?.users || []);
      setTotalPages(res.data?.pages || 1);
      setTotal(res.data?.total || 0);
      setPage(p);
    } catch { setMsg({ type: 'error', text: 'Failed to load users.' }); }
    finally { setLoading(false); }
  }, [search, role]);

  useEffect(() => { fetchUsers(1); }, [search, role]);

  const handleBlock = async (userId, block) => {
    setActionLoading(userId);
    try {
      await adminService.blockUnblockUser(userId, block);
      setMsg({ type: 'success', text: `User ${block ? 'blocked' : 'unblocked'}.` });
      fetchUsers(page);
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.detail || err.response?.data?.message || 'Action failed.' }); }
    finally { setActionLoading(null); }
  };

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(userId + '-role');
    try {
      await adminService.changeUserRole(userId, newRole);
      setMsg({ type: 'success', text: `Role updated to ${newRole}.` });
      fetchUsers(page);
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.detail || err.response?.data?.message || 'Role change failed.' }); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (userId, email) => {
    if (!window.confirm(`Permanently delete ${email}? This cannot be undone.`)) return;
    setActionLoading(userId + '-del');
    try {
      await adminService.deleteUser(userId);
      setMsg({ type: 'success', text: 'User deleted.' });
      fetchUsers(page);
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.detail || err.response?.data?.message || 'Delete failed.' }); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-4">
      {msg.text && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          {msg.text}
          <button className="ml-auto text-xs opacity-60 hover:opacity-100" onClick={() => setMsg({ type: '', text: '' })}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id="admin-user-search"
          type="text" placeholder="Search by name or email..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="form-input flex-1"
        />
        <select id="admin-role-filter" value={role} onChange={(e) => setRole(e.target.value)} className="form-input sm:w-36">
          <option value="">All Roles</option>
          <option value="User">User</option>
          <option value="Admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader size="sm" text="Loading users..." /></div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-dark-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>MFA</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div>
                        <p className="text-sm font-medium text-white">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-dark-400 font-mono">{u.email}</p>
                      </div>
                    </td>
                    <td>
                      <select
                        id={`admin-role-change-${u._id}`}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        disabled={actionLoading === u._id + '-role'}
                        className="text-xs bg-dark-700 border border-dark-600 text-white rounded-lg px-2 py-1 focus:outline-none focus:border-primary-500"
                      >
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      {u.isBlocked
                        ? <span className="badge badge-danger">🔒 Blocked</span>
                        : <span className="badge badge-success">✓ Active</span>}
                    </td>
                    <td>
                      {u.mfaEnabled
                        ? <span className="badge badge-success">🔐 On</span>
                        : <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#7886a6' }}>Off</span>}
                    </td>
                    <td className="text-xs text-dark-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          id={`admin-block-${u._id}`}
                          onClick={() => handleBlock(u._id, !u.isBlocked)}
                          disabled={actionLoading === u._id}
                          className={`btn btn-sm ${u.isBlocked ? 'btn-ghost text-success-400 hover:bg-success-500/10' : 'btn-ghost text-warning-400 hover:bg-warning-500/10'}`}
                        >
                          {actionLoading === u._id ? '...' : u.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                        <button
                          id={`admin-delete-${u._id}`}
                          onClick={() => handleDelete(u._id, u.email)}
                          disabled={actionLoading === u._id + '-del'}
                          className="btn btn-sm btn-ghost text-danger-400 hover:bg-danger-500/10"
                        >
                          {actionLoading === u._id + '-del' ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-dark-400 text-sm">Page {page} of {totalPages} ({total} users)</p>
          <div className="flex gap-2">
            <button id="admin-users-prev" onClick={() => fetchUsers(page - 1)} disabled={page === 1} className="btn btn-ghost btn-sm">← Prev</button>
            <button id="admin-users-next" onClick={() => fetchUsers(page + 1)} disabled={page === totalPages} className="btn btn-ghost btn-sm">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sessions Tab ──────────────────────────────────────────────────────────────
const SessionsTab = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [terminatingId, setTerminatingId] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    adminService.getAllSessions({ limit: 30 }).then((res) => {
      setSessions(res.data?.sessions || []);
    }).catch(() => setMsg({ type: 'error', text: 'Failed to load sessions.' }))
    .finally(() => setLoading(false));
  }, []);

  const handleTerminate = async (sessionId) => {
    setTerminatingId(sessionId);
    try {
      await adminService.forceTerminateSession(sessionId);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      setMsg({ type: 'success', text: 'Session terminated.' });
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.detail || err.response?.data?.message || 'Failed.' }); }
    finally { setTerminatingId(null); }
  };

  return (
    <div className="space-y-4">
      {msg.text && <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>{msg.text}</div>}
      <div className="card overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Loader size="sm" /></div> :
        sessions.length === 0 ? <div className="p-10 text-center text-dark-400">No active sessions.</div> : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>User</th><th>IP</th><th>Browser</th><th>OS</th><th>Started</th><th>Action</th></tr></thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <p className="text-sm font-medium text-white">{s.userId?.firstName} {s.userId?.lastName}</p>
                      <p className="text-xs text-dark-400">{s.userId?.email}</p>
                    </td>
                    <td><code className="text-xs font-mono text-dark-300">{s.ipAddress}</code></td>
                    <td className="text-xs">{s.deviceInfo?.browser || '—'}</td>
                    <td className="text-xs">{s.deviceInfo?.os || '—'}</td>
                    <td className="text-xs text-dark-400">{new Date(s.createdAt).toLocaleString()}</td>
                    <td>
                      <button
                        id={`admin-terminate-session-${s._id}`}
                        onClick={() => handleTerminate(s._id)}
                        disabled={terminatingId === s._id}
                        className="btn btn-sm btn-ghost text-danger-400 hover:bg-danger-500/10"
                      >
                        {terminatingId === s._id ? '...' : 'Terminate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Alerts Tab ────────────────────────────────────────────────────────────────
const AlertsTab = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);

  useEffect(() => {
    adminService.getAllSecurityAlerts({ limit: 30 }).then((res) => {
      setAlerts(res.data?.alerts || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleResolve = async (alertId) => {
    setResolvingId(alertId);
    try {
      await adminService.resolveAlert(alertId);
      setAlerts((prev) => prev.map((a) => a._id === alertId ? { ...a, isResolved: true } : a));
    } catch { } finally { setResolvingId(null); }
  };

  const severityBadge = (s) => ({
    LOW: <span className="badge badge-warning">LOW</span>,
    MEDIUM: <span className="badge" style={{ background: 'rgba(251,146,60,0.15)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.3)' }}>MEDIUM</span>,
    HIGH: <span className="badge badge-danger">HIGH</span>,
    CRITICAL: <span className="badge badge-danger" style={{ background: 'rgba(220,38,38,0.2)', borderColor: 'rgba(220,38,38,0.5)' }}>🔴 CRITICAL</span>,
  }[s] || <span className="badge">{s}</span>);

  return (
    <div className="space-y-3">
      {loading ? <div className="flex justify-center py-12"><Loader size="sm" /></div> :
      alerts.length === 0 ? <div className="card p-10 text-center text-dark-400">No security alerts found.</div> : (
        alerts.map((a) => (
          <div key={a._id} className={`card p-4 ${a.isResolved ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {severityBadge(a.severity)}
                  <span className="text-sm font-medium text-white">{a.alertType}</span>
                  {a.isResolved && <span className="badge badge-success">✓ Resolved</span>}
                </div>
                <p className="text-dark-300 text-sm">{a.message}</p>
                <p className="text-dark-500 text-xs mt-1">
                  {a.userId ? `${a.userId.firstName} ${a.userId.lastName} · ` : ''}{new Date(a.createdAt).toLocaleString()}
                </p>
              </div>
              {!a.isResolved && (
                <button
                  id={`admin-resolve-alert-${a._id}`}
                  onClick={() => handleResolve(a._id)}
                  disabled={resolvingId === a._id}
                  className="btn btn-sm btn-ghost text-success-400 hover:bg-success-500/10 flex-shrink-0"
                >
                  {resolvingId === a._id ? '...' : '✓ Resolve'}
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// ─── Audit Tab ─────────────────────────────────────────────────────────────────
const AuditTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getAllAuditLogs({ page: p, limit: 20 });
      setLogs(res.data?.logs || []);
      setTotalPages(res.data?.pages || 1);
      setPage(p);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(1); }, []);

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Loader size="sm" /></div> :
        logs.length === 0 ? <div className="p-10 text-center text-dark-400">No audit logs found.</div> : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Action</th><th>User</th><th>IP</th><th>Details</th><th>Time</th></tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l._id}>
                    <td><span className="badge badge-primary text-xs">{l.action}</span></td>
                    <td>
                      <p className="text-xs font-medium text-white">{l.userId?.firstName} {l.userId?.lastName}</p>
                      <p className="text-xs text-dark-400">{l.userEmail || l.userId?.email}</p>
                    </td>
                    <td><code className="text-xs font-mono text-dark-300">{l.ipAddress || '—'}</code></td>
                    <td className="text-xs text-dark-300 max-w-xs truncate">{l.details}</td>
                    <td className="text-xs text-dark-400">{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex gap-2 justify-end">
          <button id="admin-audit-prev" onClick={() => fetchLogs(page - 1)} disabled={page === 1} className="btn btn-ghost btn-sm">← Prev</button>
          <button id="admin-audit-next" onClick={() => fetchLogs(page + 1)} disabled={page === totalPages} className="btn btn-ghost btn-sm">Next →</button>
        </div>
      )}
    </div>
  );
};

export default Admin;
