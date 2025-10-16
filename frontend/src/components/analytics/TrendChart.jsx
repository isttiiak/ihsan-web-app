import React from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

export default function TrendChart({ data, period }) {
  if (!data || data.length === 0) {
    return (
      <div className="card bg-base-100 shadow-lg border border-ihsan-primary/20">
        <div className="card-body p-6">
          <h3 className="text-lg font-bold text-ihsan-primary mb-4">
            📈 Trend Chart
          </h3>
          <div className="flex items-center justify-center h-64 text-gray-400">
            <p>No data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    count: d.total,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-base-100 p-3 rounded-lg shadow-lg border border-ihsan-primary/20">
          <p className="text-sm font-bold text-ihsan-primary">
            {payload[0].payload.date}
          </p>
          <p className="text-sm">
            Count: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-base-100 shadow-lg border border-ihsan-primary/20"
    >
      <div className="card-body p-6">
        <h3 className="text-lg font-bold text-ihsan-primary mb-4">
          📈 {period}-Day Trend
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#14b8a6"
              strokeWidth={3}
              fill="url(#colorCount)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
