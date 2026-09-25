/**
 * Format a date string to a readable format
 * @param {string|Date} date
 * @param {boolean} includeTime
 */
export const formatDate = (date, includeTime = true) => {
  if (!date) return '—';
  const d = new Date(date);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
  };
  return d.toLocaleDateString('en-US', options);
};

/**
 * Format a date as relative time (e.g., "2 minutes ago")
 * @param {string|Date} date
 */
export const timeAgo = (date) => {
  if (!date) return '—';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];

  for (const { label, seconds: interval } of intervals) {
    const count = Math.floor(seconds / interval);
    if (count >= 1) {
      return `${count} ${label}${count !== 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
};

/**
 * Truncate a string to a max length
 */
export const truncate = (str, maxLength = 40) => {
  if (!str) return '';
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
};

/**
 * Capitalize first letter of each word
 */
export const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(/[\s_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get initials from name
 */
export const getInitials = (firstName, lastName) => {
  const f = firstName ? firstName[0].toUpperCase() : '';
  const l = lastName ? lastName[0].toUpperCase() : '';
  return `${f}${l}` || '?';
};

/**
 * Get severity color class
 */
export const getSeverityClass = (severity) => {
  const map = {
    LOW: 'badge-success',
    MEDIUM: 'badge-warning',
    HIGH: 'badge-danger',
    CRITICAL: 'badge-danger',
  };
  return map[severity] || 'badge-secondary';
};

/**
 * Get login status color class
 */
export const getStatusClass = (status) => {
  const map = {
    SUCCESS: 'badge-success',
    FAILED: 'badge-danger',
    LOCKED: 'badge-warning',
  };
  return map[status] || 'badge-secondary';
};

/**
 * Get risk score color
 */
export const getRiskColor = (score) => {
  if (score >= 70) return 'text-danger-400';
  if (score >= 40) return 'text-warning-400';
  if (score >= 20) return 'text-primary-400';
  return 'text-success-400';
};

/**
 * Get risk level label
 */
export const getRiskLevel = (score) => {
  if (score >= 70) return 'CRITICAL';
  if (score >= 40) return 'HIGH';
  if (score >= 20) return 'MEDIUM';
  return 'LOW';
};

/**
 * Mask email for display
 */
export const maskEmail = (email) => {
  if (!email) return '';
  const [user, domain] = email.split('@');
  const masked = user[0] + '****' + (user.length > 1 ? user[user.length - 1] : '');
  return `${masked}@${domain}`;
};

/**
 * Parse device info string for display
 */
export const formatDevice = (deviceInfo) => {
  if (!deviceInfo) return 'Unknown';
  const { browser, os, device } = deviceInfo;
  return [browser, os].filter(Boolean).join(' / ') || device || 'Unknown';
};

/**
 * Get device type icon name
 */
export const getDeviceIcon = (deviceInfo) => {
  if (!deviceInfo) return 'Monitor';
  const device = (deviceInfo.device || '').toLowerCase();
  if (device === 'mobile') return 'Smartphone';
  if (device === 'tablet') return 'Tablet';
  return 'Monitor';
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sleep utility
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Build query string from object
 */
export const buildQuery = (params) => {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return q ? `?${q}` : '';
};
