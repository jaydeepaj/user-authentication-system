/**
 * Client-side form validation helpers.
 * Works with react-hook-form's `register` validate option.
 */

export const validators = {
  // ── Name ──────────────────────────────────────────────────────────────────
  firstName: {
    required: 'First name is required',
    minLength: { value: 2, message: 'At least 2 characters' },
    maxLength: { value: 50, message: 'Maximum 50 characters' },
    pattern: { value: /^[a-zA-Z\s'-]+$/, message: 'Only letters, spaces, hyphens, apostrophes allowed' },
  },
  lastName: {
    required: 'Last name is required',
    minLength: { value: 2, message: 'At least 2 characters' },
    maxLength: { value: 50, message: 'Maximum 50 characters' },
    pattern: { value: /^[a-zA-Z\s'-]+$/, message: 'Only letters, spaces, hyphens, apostrophes allowed' },
  },

  // ── Email ─────────────────────────────────────────────────────────────────
  email: {
    required: 'Email address is required',
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Enter a valid email address',
    },
  },

  // ── Password ──────────────────────────────────────────────────────────────
  password: {
    required: 'Password is required',
    minLength: { value: 8, message: 'Minimum 8 characters' },
    validate: {
      hasUppercase: (v) => /[A-Z]/.test(v) || 'Must contain at least one uppercase letter',
      hasLowercase: (v) => /[a-z]/.test(v) || 'Must contain at least one lowercase letter',
      hasNumber: (v) => /\d/.test(v) || 'Must contain at least one number',
      hasSpecial: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v) || 'Must contain at least one special character',
    },
  },

  currentPassword: {
    required: 'Current password is required',
  },

  // ── OTP ───────────────────────────────────────────────────────────────────
  otp: {
    required: 'OTP code is required',
    minLength: { value: 6, message: 'OTP must be 6 digits' },
    maxLength: { value: 6, message: 'OTP must be 6 digits' },
    pattern: { value: /^\d{6}$/, message: 'OTP must be 6 digits' },
  },

  // ── TOTP ──────────────────────────────────────────────────────────────────
  totpCode: {
    required: 'Authenticator code is required',
    minLength: { value: 6, message: 'Code must be 6 digits' },
    maxLength: { value: 8, message: 'Code must be 6-8 characters' },
  },
};

/**
 * Calculate password strength score (0–4).
 * @param {string} password
 * @returns {{ score: number, label: string, color: string }}
 */
export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  const levels = [
    { label: 'Very Weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Strong', color: 'bg-blue-500' },
    { label: 'Very Strong', color: 'bg-green-500' },
  ];

  return { score, ...levels[score] };
};
