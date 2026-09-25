import axios from 'axios';

const BASE = '/api/auth';

export const authService = {
  /** Fetch CSRF token (GET — no mutation, safe) */
  getCsrfToken: () => axios.get(`${BASE}/csrf-token`, { withCredentials: true }),

  /** Register a new account */
  register: (data) =>
    axios.post(`${BASE}/register`, data, { withCredentials: true }),

  /** Login with email + password */
  login: (data) =>
    axios.post(`${BASE}/login`, data, { withCredentials: true }),

  /** Verify email address with OTP */
  verifyEmail: (data) =>
    axios.post(`${BASE}/verify-email`, data, { withCredentials: true }),

  /** Resend email verification OTP */
  resendVerification: (data) =>
    axios.post(`${BASE}/resend-verification`, data, { withCredentials: true }),

  /** Verify MFA code (Step 2 of login) */
  verifyMfaLogin: (data) =>
    axios.post(`${BASE}/mfa/verify-login`, data, { withCredentials: true }),

  /** Send email OTP as MFA fallback */
  sendMfaOtp: (data) =>
    axios.post(`${BASE}/mfa/send-otp`, data, { withCredentials: true }),

  /** Rotate access token using HTTP-only refresh cookie */
  refresh: () =>
    axios.post(`${BASE}/refresh`, {}, { withCredentials: true }),

  /** Logout and revoke all sessions */
  logout: () =>
    axios.post(`${BASE}/logout`, {}, { withCredentials: true }),

  /** Request password reset email / OTP */
  forgotPassword: (data) =>
    axios.post(`${BASE}/forgot-password`, data, { withCredentials: true }),

  /** Verify password reset OTP code */
  verifyResetOtp: (data) =>
    axios.post(`${BASE}/verify-reset-otp`, data, { withCredentials: true }),

  /** Reset password using token */
  resetPassword: (data) =>
    axios.post(`${BASE}/reset-password`, data, { withCredentials: true }),
};
