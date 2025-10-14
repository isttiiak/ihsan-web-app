import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Profile() {
  const { user, setUser } = useAuthStore();
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

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="card bg-base-200 shadow">
        <div className="card-body gap-4">
          <h2 className="card-title">Edit Profile</h2>

          <div className="grid md:grid-cols-2 gap-4 items-start">
            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                className="input input-bordered"
                value={user?.email || ""}
                disabled
              />
            </div>
            <div className="form-control md:col-span-2">
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
        </div>
      </div>
    </div>
  );
}
