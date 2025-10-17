import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion } from "framer-motion";
import AnimatedBackground from "../components/AnimatedBackground";
import {
  UserCircleIcon,
  CameraIcon,
  CheckCircleIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    setSaving(true);
    setSaved(false);
    const idToken = localStorage.getItem("ihsan_idToken");
    if (!idToken) {
      alert("Please log in");
      setSaving(false);
      return;
    }
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
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
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
    <AnimatedBackground variant="dark">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <UserCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-ihsan-primary" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-teal bg-clip-text text-transparent">
                Edit Profile
              </h1>
            </div>
            <p className="text-sm sm:text-base opacity-70">
              Update your personal information
            </p>
          </motion.div>

          {/* Profile Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card bg-base-100 shadow-islamic border border-ihsan-primary/10"
          >
            <div className="card-body p-6 sm:p-8">
              <div className="space-y-6">
                {/* Profile Photo Section */}
                <div className="flex flex-col items-center gap-4 pb-6 border-b border-base-300">
                  <div className="relative">
                    <div className="avatar">
                      <div className="w-24 sm:w-32 rounded-full ring ring-ihsan-primary ring-offset-base-100 ring-offset-2">
                        {preview || profile.photoUrl ? (
                          <img
                            src={preview || profile.photoUrl}
                            alt="profile"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-teal flex items-center justify-center">
                            <UserCircleIcon className="w-16 sm:w-20 h-16 sm:h-20 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    <label className="absolute bottom-0 right-0 btn btn-circle btn-sm bg-ihsan-primary hover:bg-ihsan-secondary text-white border-0 shadow-lg">
                      <CameraIcon className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onFileChange}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  {uploading && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="loading loading-spinner loading-sm text-ihsan-primary" />
                      <span>Uploading photo...</span>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email (Read-only) */}
                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text font-medium">Email</span>
                      <span className="label-text-alt text-xs opacity-60">
                        Cannot be changed
                      </span>
                    </label>
                    <input
                      className="input input-bordered bg-base-200"
                      value={user?.email || ""}
                      disabled
                    />
                  </div>

                  {/* Display Name */}
                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text font-medium">
                        Display Name
                      </span>
                    </label>
                    <input
                      className="input input-bordered focus:border-ihsan-primary focus:outline-none focus:ring-2 focus:ring-ihsan-primary/20 transition-all"
                      placeholder="Enter your name"
                      value={profile.displayName}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          displayName: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Gender */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Gender</span>
                    </label>
                    <select
                      className="select select-bordered focus:border-ihsan-primary focus:outline-none focus:ring-2 focus:ring-ihsan-primary/20 transition-all"
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

                  {/* Birth Date */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Birth Date</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered focus:border-ihsan-primary focus:outline-none focus:ring-2 focus:ring-ihsan-primary/20 transition-all"
                      value={profile.birthDate}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, birthDate: e.target.value }))
                      }
                    />
                  </div>

                  {/* Occupation */}
                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text font-medium">Occupation</span>
                    </label>
                    <input
                      className="input input-bordered focus:border-ihsan-primary focus:outline-none focus:ring-2 focus:ring-ihsan-primary/20 transition-all"
                      placeholder="Your profession or field"
                      value={profile.occupation}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          occupation: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    className="btn btn-lg flex-1 bg-gradient-teal text-white border-0 hover:shadow-islamic transition-all gap-2"
                    onClick={saveProfile}
                    disabled={uploading || saving}
                  >
                    {saving ? (
                      <>
                        <span className="loading loading-spinner loading-md" />
                        Saving...
                      </>
                    ) : saved ? (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        Saved!
                      </>
                    ) : (
                      "Save Profile"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
