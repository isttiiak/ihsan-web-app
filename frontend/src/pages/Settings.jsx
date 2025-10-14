import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";

export default function Settings() {
  const { aiEnabled, setAiEnabled } = useAuthStore();
  const [theme, setTheme] = useState(
    localStorage.getItem("ihsan_theme") || "emerald"
  );
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ihsan_theme", theme);
  }, [theme]);

  const getSuggestions = async () => {
    setLoadingSuggest(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/ai/suggest`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userSummary: "Example summary placeholder.",
          }),
        }
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggest(false);
    }
  };

  const exportProfile = () => {
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
  };

  const importProfile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      localStorage.setItem("ihsan_user", JSON.stringify(data));
      alert("Imported local profile cache. Refresh to reflect changes.");
    } catch {
      alert("Invalid file");
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="card bg-base-200 shadow">
        <div className="card-body gap-6">
          <h2 className="card-title">Settings</h2>

          <div className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Theme</span>
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
              <label className="label cursor-pointer justify-between">
                <span className="label-text font-medium">
                  Enable AI suggestions
                </span>
                <input
                  type="checkbox"
                  className="toggle"
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                />
              </label>
            </div>

            <div className="form-control">
              <span className="label-text font-medium mb-2">Profile</span>
              <Link to="/profile" className="btn btn-sm w-fit">
                Edit Profile
              </Link>
            </div>

            <div className="form-control">
              <span className="label-text font-medium mb-2">Data</span>
              <div className="flex flex-wrap gap-2">
                <button className="btn" onClick={exportProfile}>
                  Export Profile
                </button>
                <label className="btn">
                  Import Profile
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={importProfile}
                  />
                </label>
              </div>
            </div>

            {aiEnabled && (
              <div className="form-control space-y-2">
                <button
                  className={`btn btn-primary ${
                    loadingSuggest ? "loading" : ""
                  }`}
                  onClick={getSuggestions}
                  disabled={loadingSuggest}
                >
                  {loadingSuggest ? "Loading" : "Get AI Suggestions"}
                </button>
                {suggestions && (
                  <div className="text-sm">
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
    </div>
  );
}
