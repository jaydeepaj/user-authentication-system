import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-dark-800 border border-secondary-500/20 rounded-xl px-4 py-3 shadow-card-hover text-sm">
        <p className="text-dark-300 mb-1">{label}</p>
        <p className="text-secondary-400 font-semibold">{payload[0].value} new users</p>
      </div>
    );
  }
  return null;
};

/**
 * Line chart for user registration growth over time.
 * Accepts `data` as [{ date: 'Jan', users: 12 }, ...]
 */
const UserGrowthChart = ({ data = [] }) => {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
        <Line
          type="monotone"
          dataKey="users"
          stroke="#9f7aea"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: '#9f7aea', stroke: '#0c101b', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default UserGrowthChart;
