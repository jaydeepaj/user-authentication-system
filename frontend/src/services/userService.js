import axios from 'axios';

const BASE = '/api/user';

export const userService = {
  /** Get current user's profile */
  getProfile: () => axios.get(`${BASE}/me`, { withCredentials: true }),

  /** Update profile (firstName, lastName) */
  updateProfile: (data) =>
    axios.put(`${BASE}/me`, data, { withCredentials: true }),

  /** Change password */
  changePassword: (data) =>
    axios.put(`${BASE}/change-password`, data, { withCredentials: true }),

  // ── MFA ───────────────────────────────────────────────────────────────────

  /** Initiate MFA setup — returns QR code and manual key */
  setupMfa: () => axios.post(`${BASE}/mfa/setup`, {}, { withCredentials: true }),

  /** Confirm MFA setup with TOTP code — returns backup codes */
  confirmMfa: (data) =>
    axios.post(`${BASE}/mfa/confirm`, data, { withCredentials: true }),

  /** Disable MFA */
  disableMfa: (data) =>
    axios.delete(`${BASE}/mfa/disable`, { data, withCredentials: true }),

  // ── Sessions ──────────────────────────────────────────────────────────────

  /** Get all active sessions */
  getSessions: () => axios.get(`${BASE}/sessions`, { withCredentials: true }),

  /** Terminate a specific session */
  terminateSession: (sessionId) =>
    axios.delete(`${BASE}/sessions/${sessionId}`, { withCredentials: true }),

  /** Terminate all sessions */
  terminateAllSessions: () =>
    axios.delete(`${BASE}/sessions`, { withCredentials: true }),

  // ── History & Logs ────────────────────────────────────────────────────────

  /** Get login history with pagination */
  getLoginHistory: (params = {}) =>
    axios.get(`${BASE}/login-history`, { params, withCredentials: true }),

  /** Get audit log with pagination */
  getAuditLog: (params = {}) =>
    axios.get(`${BASE}/audit-log`, { params, withCredentials: true }),

  /** Get security alerts */
  getSecurityAlerts: () =>
    axios.get(`${BASE}/security-alerts`, { withCredentials: true }),

  // ── Account Deletion ──────────────────────────────────────────────────────

  /** Step 1: Request account deletion OTP after entering password */
  requestDeleteAccountOtp: (data) =>
    axios.post(`${BASE}/delete-account/request-otp`, data, { withCredentials: true }),

  /** Step 2 & 3: Confirm account deletion with OTP */
  confirmDeleteAccount: (data) =>
    axios.post(`${BASE}/delete-account/confirm`, data, { withCredentials: true }),
};
