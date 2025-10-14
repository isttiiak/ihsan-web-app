import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";

export default function Settings() {
  const { aiEnabled, setAiEnabled } = useAuthStore();
  const [theme, setTheme] = useState(
    localStorage.getItem("ihsan_theme") || "emerald"
  );
  const [suggestions, setSuggestions] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ihsan_theme", theme);
  }, [theme]);

  const getSuggestions = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/ai/suggest`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userSummary: "Last week: 500 counts, mornings frequent.",
        }),
      }
    );
    const data = await res.json();
    setSuggestions(data);
  };

  const exportSessions = async () => {
    try {
      const idToken = localStorage.getItem("ihsan_idToken");
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/zikr/sessions`,
        {
          headers: { Authorization: idToken ? `Bearer ${idToken}` : "" },
        }
      );
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data.sessions || [], null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ihsan-zikr-sessions.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="card bg-base-200 shadow">
        <div className="card-body gap-4">
          <h2 className="card-title">Settings</h2>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Theme</span>
            </label>
            <select
              className="select select-bordered"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="emerald">Emerald</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Enable AI suggestions</span>
              <input
                type="checkbox"
                className="toggle"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="btn"
              onClick={() => {
                const data = JSON.stringify(
                  JSON.parse(localStorage.getItem("ihsan_user") || "{}"),
                  null,
                  2
                );
                const blob = new Blob([data], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "ihsan-user.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export Profile
            </button>

            <button className="btn" onClick={exportSessions}>
              Export Zikr Sessions
            </button>

            <label className="btn">
              Import Profile
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  try {
                    const data = JSON.parse(text);
                    localStorage.setItem("ihsan_user", JSON.stringify(data));
                    alert("Imported.");
                  } catch {
                    alert("Invalid file");
                  }
                }}
              />
            </label>
          </div>

          {aiEnabled && (
            <div className="mt-2">
              <button className="btn btn-primary" onClick={getSuggestions}>
                Get AI Suggestions
              </button>
              {suggestions && (
                <div className="mt-2 text-sm">
                  <div className="font-semibold">Suggestions:</div>
                  <ul className="list-disc ml-6">
                    {suggestions.suggestions?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                  <div className="mt-1 opacity-80">
                    {suggestions.motivation}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
