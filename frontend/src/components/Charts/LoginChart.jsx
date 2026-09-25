import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-dark-800 border border-primary-500/20 rounded-xl px-4 py-3 shadow-card-hover text-sm">
        <p className="text-dark-300 mb-1">{label}</p>
        <p className="text-primary-400 font-semibold">{payload[0].value} logins</p>
      </div>
    );
  }
  return null;
};

/**
 * Area chart showing login activity over time.
 * Accepts `data` as [{ date: 'Mon', logins: 42 }, ...]
 */
const LoginChart = ({ data = [] }) => {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="loginGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="date"
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
        <Area
          type="monotone"
          dataKey="logins"
          stroke="#00f0ff"
          strokeWidth={2}
          fill="url(#loginGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#00f0ff', stroke: '#0c101b', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default LoginChart;
