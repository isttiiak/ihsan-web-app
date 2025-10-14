import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [range, setRange] = useState("7d");

  useEffect(() => {
    const idToken = localStorage.getItem("ihsan_idToken");
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/zikr/stats?range=${range}`, {
      headers: { Authorization: idToken ? `Bearer ${idToken}` : "" },
    })
      .then((r) => r.json())
      .then((d) => setSummary(d.summary));
  }, [range]);

  if (!summary) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl">Analytics</h2>
        <select
          className="select select-bordered"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <h3 className="card-title">Daily Totals</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.dailyStats}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#2E7D32" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <h3 className="card-title">Per Zikr Totals</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.perType}>
                  <XAxis dataKey="zikrType" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#CDA434" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 card bg-base-200">
        <div className="card-body">
          <div className="text-lg">
            Total Count:{" "}
            <span className="font-semibold">{summary.totalCount}</span>
          </div>
          <div className="opacity-70">
            Top Zikr:{" "}
            {summary.topZikrTypes
              .map((t) => `${t.name} (${t.total})`)
              .join(", ") || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
