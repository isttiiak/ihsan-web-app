import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Settings() {
  const { aiEnabled, setAiEnabled, user, setUser } = useAuthStore();
  const [theme, setTheme] = useState(
    localStorage.getItem("ihsan_theme") || "emerald"
  );
  const [suggestions, setSuggestions] = useState(null);

  const [profile, setProfile] = useState({
    displayName: user?.displayName || "",
    photoUrl: "",
    gender: "",
    birthDate: "",
    occupation: "",
  });
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ihsan_theme", theme);
  }, [theme]);

  useEffect(() => {
    const idToken = localStorage.getItem("ihsan_idToken");
    if (!idToken) return;
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) {
          setProfile({
            displayName: d.user.displayName || "",
            photoUrl: d.user.photoUrl || "",
            gender: d.user.gender || "",
            birthDate: d.user.birthDate
              ? d.user.birthDate.substring(0, 10)
              : "",
            occupation: d.user.occupation || "",
          });
          setPreview(d.user.photoUrl || "");
        }
      });
  }, []);

  const saveProfile = async () => {
    const idToken = localStorage.getItem("ihsan_idToken");
    if (!idToken) return alert("Please log in");
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        displayName: profile.displayName,
        photoUrl: profile.photoUrl,
        gender: profile.gender || undefined,
        birthDate: profile.birthDate || undefined,
        occupation: profile.occupation || undefined,
      }),
    });
    try {
      const data = await res.json();
      if (data?.user) {
        // Update local auth store so Navbar reflects new values
        setUser({
          ...(user || {}),
          displayName: data.user.displayName || profile.displayName,
          photoUrl: data.user.photoUrl || profile.photoUrl,
        });
        localStorage.setItem(
          "ihsan_user",
          JSON.stringify({
            ...JSON.parse(localStorage.getItem("ihsan_user") || "{}"),
            displayName: data.user.displayName || profile.displayName,
            photoUrl: data.user.photoUrl || profile.photoUrl,
          })
        );
      }
    } catch {}
    alert("Profile saved");
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    try {
      setUploading(true);
      const uid = user?.uid || "anon";
      const fileRef = ref(storage, `profile/${uid}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setProfile((p) => ({ ...p, photoUrl: url }));
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

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
    <div className="p-4 max-w-3xl mx-auto">
      <div className="card bg-base-200 shadow">
        <div className="card-body gap-4">
          <h2 className="card-title">Settings</h2>

          <div className="grid md:grid-cols-2 gap-4 items-start">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Display name</span>
              </label>
              <input
                className="input input-bordered"
                value={profile.displayName}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, displayName: e.target.value }))
                }
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Photo</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="avatar">
                  <div className="w-16 rounded-full">
                    {preview || profile.photoUrl ? (
                      <img src={preview || profile.photoUrl} alt="preview" />
                    ) : (
                      <div className="w-16 h-16 bg-base-300" />
                    )}
                  </div>
                </div>
                <label className="btn btn-sm">
                  {uploading ? "Uploading..." : "Choose file"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFileChange}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Gender</span>
              </label>
              <select
                className="select select-bordered"
                value={profile.gender}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, gender: e.target.value }))
                }
              >
                <option value="">Not set</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_say">Prefer not to say</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Birth date</span>
              </label>
              <input
                type="date"
                className="input input-bordered"
                value={profile.birthDate}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, birthDate: e.target.value }))
                }
              />
            </div>
            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text">Occupation</span>
              </label>
              <input
                className="input input-bordered"
                value={profile.occupation}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, occupation: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <button
              className="btn btn-primary"
              onClick={saveProfile}
              disabled={uploading}
            >
              Save profile
            </button>
          </div>

          <div className="form-control mt-4">
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
