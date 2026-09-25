// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// JWT / Token
export const ACCESS_TOKEN_KEY = 'sax_access_token';

// Roles
export const ROLES = {
  USER: 'User',
  ADMIN: 'Admin',
};

// Severity Levels
export const SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const SEVERITY_COLORS = {
  LOW: 'badge-success',
  MEDIUM: 'badge-warning',
  HIGH: 'badge-danger',
  CRITICAL: 'badge-danger',
};

export const SEVERITY_DOT_COLORS = {
  LOW: 'bg-success-500',
  MEDIUM: 'bg-warning-500',
  HIGH: 'bg-danger-500',
  CRITICAL: 'bg-danger-500',
};

// Login History Status
export const LOGIN_STATUS_COLORS = {
  SUCCESS: 'badge-success',
  FAILED: 'badge-danger',
  LOCKED: 'badge-warning',
};

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// OTP
export const OTP_LENGTH = 6;

// Recharts chart colors
export const CHART_COLORS = {
  primary: '#00f0ff',
  secondary: '#9f7aea',
  danger: '#ff3b30',
  success: '#22c55e',
  warning: '#f59e0b',
  muted: '#566d93',
};

// Navigation Links
export const NAV_LINKS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/profile', label: 'Profile', icon: 'User' },
  { path: '/security', label: 'Security', icon: 'Shield' },
  { path: '/sessions', label: 'Sessions', icon: 'Monitor' },
  { path: '/login-history', label: 'Login History', icon: 'History' },
  { path: '/settings', label: 'Settings', icon: 'Settings' },
];

export const ADMIN_NAV_LINKS = [
  { path: '/admin', label: 'Admin Panel', icon: 'Crown' },
];

// MFA Methods
export const MFA_METHODS = {
  TOTP: 'TOTP',
  EMAIL: 'EMAIL_OTP',
};

// Animation variants (Framer Motion)
export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.25, ease: 'easeOut' },
};

export const FADE_IN = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 },
};

export const SLIDE_UP = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' },
};

export const STAGGER_CONTAINER = {
  animate: { transition: { staggerChildren: 0.08 } },
};

export const STAGGER_ITEM = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};
