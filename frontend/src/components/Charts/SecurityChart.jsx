import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const SEVERITY_COLORS = {
  LOW: '#fbbf24',
  MEDIUM: '#f59e0b',
  HIGH: '#ff6b6b',
  CRITICAL: '#ff3b30',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-dark-800 border border-secondary-500/20 rounded-xl px-4 py-3 shadow-card-hover text-sm">
        <p className="text-dark-300 mb-1">{label}</p>
        <p className="font-semibold" style={{ color: SEVERITY_COLORS[label] || '#9f7aea' }}>
          {payload[0].value} alerts
        </p>
      </div>
    );
  }
  return null;
};

/**
 * Bar chart for security alerts by severity.
 * Accepts `data` as [{ severity: 'HIGH', count: 5 }, ...]
 */
const SecurityChart = ({ data = [] }) => {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="severity"
          tick={{ fill: '#7886a6', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#7886a6', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
          {data.map((entry, index) => (
            <Cell key={index} fill={SEVERITY_COLORS[entry.severity] || '#9f7aea'} opacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SecurityChart;
