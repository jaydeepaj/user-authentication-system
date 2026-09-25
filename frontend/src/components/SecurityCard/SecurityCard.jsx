import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable stat/security card with icon, value, label and optional trend/glow.
 *
 * @param {string} icon - Emoji or JSX icon
 * @param {string|number} value - Main metric value
 * @param {string} label - Card label
 * @param {string} sublabel - Optional secondary text
 * @param {'cyan'|'purple'|'red'|'green'|'yellow'} color - Glow color
 * @param {number} trend - Percentage change (positive = up, negative = down)
 * @param {boolean} loading
 */
const SecurityCard = ({
  icon,
  value,
  label,
  sublabel,
  color = 'cyan',
  trend,
  loading = false,
  className = '',
}) => {
  const colorMap = {
    cyan:   { bg: 'bg-primary-500/10',   text: 'text-primary-400',   border: 'border-primary-500/20',   glow: 'shadow-glow-sm' },
    purple: { bg: 'bg-secondary-500/10', text: 'text-secondary-400', border: 'border-secondary-500/20', glow: 'shadow-glow-purple' },
    red:    { bg: 'bg-danger-500/10',    text: 'text-danger-400',    border: 'border-danger-500/20',    glow: '' },
    green:  { bg: 'bg-success-500/10',   text: 'text-success-400',   border: 'border-success-500/20',   glow: '' },
    yellow: { bg: 'bg-warning-500/10',   text: 'text-warning-400',   border: 'border-warning-500/20',   glow: '' },
  };

  const c = colorMap[color] || colorMap.cyan;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`card-hover p-5 ${className}`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`stat-icon ${c.bg} border ${c.border} ${c.text} text-2xl ${c.glow}`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <>
              <div className="h-7 w-20 bg-dark-600/50 rounded-lg shimmer mb-2" />
              <div className="h-4 w-32 bg-dark-700/50 rounded shimmer" />
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${c.text}`}>{value ?? '—'}</span>
                {trend !== undefined && (
                  <span
                    className={`text-xs font-semibold ${
                      trend >= 0 ? 'text-success-400' : 'text-danger-400'
                    }`}
                  >
                    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                  </span>
                )}
              </div>
              <p className="text-dark-200 text-sm font-medium mt-0.5">{label}</p>
              {sublabel && <p className="text-dark-400 text-xs mt-0.5">{sublabel}</p>}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SecurityCard;
