import React, { useEffect, useState } from "react";

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idToken = localStorage.getItem("ihsan_idToken");
    if (!idToken) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/zikr/summary`,
          { headers: { Authorization: `Bearer ${idToken}` } }
        );
        if (res.status === 401) {
          setUnauthorized(true);
          return;
        }
        const data = await res.json();
        setSummary(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (unauthorized)
    return <div className="p-4">Please log in to view analytics.</div>;
  if (loading) return <div className="p-4">Loading...</div>;
  if (!summary)
    return <div className="p-4">No data yet. Start counting your Zikr.</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl mb-4">Analytics</h2>

      <div className="card bg-base-200 shadow mb-6">
        <div className="card-body">
          <div className="text-sm opacity-70">All-time Zikr</div>
          <div className="text-5xl font-bold text-ihsan-primary">
            {summary.totalCount || 0}
          </div>
        </div>
      </div>

      <h3 className="text-xl mb-2">Per Zikr Totals</h3>
      {summary.perType?.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {summary.perType.map((t) => (
            <div key={t.zikrType} className="stat bg-base-200 rounded-box">
              <div className="stat-title">{t.zikrType}</div>
              <div className="stat-value text-primary">{t.total}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="opacity-70">No zikr counted yet.</div>
      )}
    </div>
  );
}
