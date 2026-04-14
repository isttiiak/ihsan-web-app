import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { storage } from '../firebase.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';
import { UserCircleIcon, CameraIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import BackButton from '../components/BackButton.js';

interface ProfileData {
  displayName: string;
  photoUrl: string;
  gender: string;
  birthDate: string;
  occupation: string;
}

interface UserResponse {
  user?: {
    displayName?: string;
    photoUrl?: string;
    gender?: string;
    birthDate?: string;
    occupation?: string;
  };
}

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData>({
    displayName: user?.displayName || '',
    photoUrl: '',
    gender: '',
    birthDate: '',
    occupation: '',
  });
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const idToken = localStorage.getItem('ihsan_idToken');
    if (!idToken) return;
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
      .then((r) => r.json())
      .then((d: UserResponse) => {
        if (d?.user) {
          setProfile({
            displayName: d.user.displayName || '',
            photoUrl: d.user.photoUrl || '',
            gender: d.user.gender || '',
            birthDate: d.user.birthDate ? d.user.birthDate.substring(0, 10) : '',
            occupation: d.user.occupation || '',
          });
          setPreview(d.user.photoUrl || '');
        }
      });
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    setSaved(false);
    const idToken = localStorage.getItem('ihsan_idToken');
    if (!idToken) {
      alert('Please log in');
      setSaving(false);
      return;
    }
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({
        displayName: profile.displayName,
        photoUrl: profile.photoUrl,
        gender: profile.gender || undefined,
        birthDate: profile.birthDate || undefined,
        occupation: profile.occupation || undefined,
      }),
    });
    try {
      const data = await res.json() as UserResponse;
      if (data?.user) {
        setUser({
          ...(user ?? { uid: '', email: null }),
          displayName: data.user.displayName || profile.displayName,
          photoUrl: data.user.photoUrl || profile.photoUrl,
        });
        localStorage.setItem(
          'ihsan_user',
          JSON.stringify({
            ...JSON.parse(localStorage.getItem('ihsan_user') || '{}'),
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

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    try {
      setUploading(true);
      const uid = user?.uid || 'anon';
      const fileRef = ref(storage, `profile/${uid}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setProfile((p) => ({ ...p, photoUrl: url }));
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatedBackground variant="dark">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-start"><BackButton /></div>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <UserCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-brand-emerald" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-emerald">Edit Profile</h1>
            </div>
            <p className="text-sm sm:text-base text-white/60">Update your personal information</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card bg-brand-surface border border-brand-border shadow-glass"
          >
            <div className="card-body p-6 sm:p-8">
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 pb-6 border-b border-brand-border">
                  <div className="relative">
                    <div className="avatar">
                      <div className="w-24 sm:w-32 rounded-full ring ring-brand-emerald ring-offset-brand-deep ring-offset-2">
                        {preview || profile.photoUrl ? (
                          <img src={preview || profile.photoUrl} alt="profile" />
                        ) : (
                          <div className="w-full h-full bg-brand-emerald/20 flex items-center justify-center">
                            <UserCircleIcon className="w-16 sm:w-20 h-16 sm:h-20 text-brand-emerald/60" />
                          </div>
                        )}
                      </div>
                    </div>
                    <label className="absolute bottom-0 right-0 btn btn-circle btn-sm bg-brand-emerald hover:bg-brand-emerald-dim text-white border-0 shadow-lg">
                      <CameraIcon className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={onFileChange} disabled={uploading} />
                    </label>
                  </div>
                  {uploading && (
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <span className="loading loading-spinner loading-sm text-brand-emerald" />
                      <span>Uploading photo...</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text font-medium text-white/80">Email</span>
                      <span className="label-text-alt text-xs text-white/40">Cannot be changed</span>
                    </label>
                    <input className="input input-bordered bg-brand-deep border-brand-border text-white/50" value={user?.email || ''} disabled />
                  </div>

                  <div className="form-control md:col-span-2">
                    <label className="label"><span className="label-text font-medium text-white/80">Display Name</span></label>
                    <input
                      className="input input-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald"
                      placeholder="Enter your name"
                      value={profile.displayName}
                      onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text font-medium text-white/80">Gender</span></label>
                    <select
                      className="select select-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald"
                      value={profile.gender}
                      onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}
                    >
                      <option value="">Not set</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text font-medium text-white/80">Birth Date</span></label>
                    <input
                      type="date"
                      className="input input-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald"
                      value={profile.birthDate}
                      onChange={(e) => setProfile((p) => ({ ...p, birthDate: e.target.value }))}
                    />
                  </div>

                  <div className="form-control md:col-span-2">
                    <label className="label"><span className="label-text font-medium text-white/80">Occupation</span></label>
                    <input
                      className="input input-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald"
                      placeholder="Your profession or field"
                      value={profile.occupation}
                      onChange={(e) => setProfile((p) => ({ ...p, occupation: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    className="btn btn-lg flex-1 bg-brand-emerald hover:bg-brand-emerald-dim text-white border-0 transition-all gap-2"
                    onClick={saveProfile}
                    disabled={uploading || saving}
                  >
                    {saving ? (
                      <><span className="loading loading-spinner loading-md" /> Saving...</>
                    ) : saved ? (
                      <><CheckCircleIcon className="w-5 h-5" /> Saved!</>
                    ) : (
                      'Save Profile'
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
