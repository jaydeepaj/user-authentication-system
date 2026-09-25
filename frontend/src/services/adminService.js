import axios from 'axios';

const BASE = '/api/admin';

export const adminService = {
  // ── Dashboard ─────────────────────────────────────────────────────────────

  /** Get platform-wide stats */
  getDashboardStats: () =>
    axios.get(`${BASE}/stats`, { withCredentials: true }),

  // ── User Management ───────────────────────────────────────────────────────

  /** Get all users with pagination/search/filter */
  getAllUsers: (params = {}) =>
    axios.get(`${BASE}/users`, { params, withCredentials: true }),

  /** Get a specific user by ID */
  getUserById: (userId) =>
    axios.get(`${BASE}/users/${userId}`, { withCredentials: true }),

  /** Block or unblock a user */
  blockUnblockUser: (userId, block) =>
    axios.put(`${BASE}/users/${userId}/block`, { block }, { withCredentials: true }),

  /** Change a user's role */
  changeUserRole: (userId, role) =>
    axios.put(`${BASE}/users/${userId}/role`, { role }, { withCredentials: true }),

  /** Permanently delete a user */
  deleteUser: (userId) =>
    axios.delete(`${BASE}/users/${userId}`, { withCredentials: true }),

  // ── Sessions ──────────────────────────────────────────────────────────────

  /** Get all active sessions across the platform */
  getAllSessions: (params = {}) =>
    axios.get(`${BASE}/sessions`, { params, withCredentials: true }),

  /** Force-terminate any session */
  forceTerminateSession: (sessionId) =>
    axios.delete(`${BASE}/sessions/${sessionId}`, { withCredentials: true }),

  // ── Security Alerts ───────────────────────────────────────────────────────

  /** Get all security alerts with filters */
  getAllSecurityAlerts: (params = {}) =>
    axios.get(`${BASE}/security-alerts`, { params, withCredentials: true }),

  /** Resolve a specific security alert */
  resolveAlert: (alertId) =>
    axios.put(`${BASE}/security-alerts/${alertId}/resolve`, {}, { withCredentials: true }),

  // ── Audit Logs ────────────────────────────────────────────────────────────

  /** Get all audit logs with filters */
  getAllAuditLogs: (params = {}) =>
    axios.get(`${BASE}/audit-logs`, { params, withCredentials: true }),

  // ── Login History ─────────────────────────────────────────────────────────

  /** Get platform-wide login history */
  getPlatformLoginHistory: (params = {}) =>
    axios.get(`${BASE}/login-history`, { params, withCredentials: true }),
};
