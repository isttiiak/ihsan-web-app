import React from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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
          <LineChart
            data={chartData}
            margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
          >
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--brand-emerald)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--brand-emerald)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="rgba(255,255,255,0.6)"
            />
            <YAxis tick={{ fontSize: 12 }} stroke="rgba(255,255,255,0.6)" />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.9)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                borderRadius: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--brand-emerald)"
              strokeWidth={2}
              dot={false}
              fillOpacity={1}
              fill="url(#trendGradient)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
