import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { storage } from '../firebase.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';
import {
  UserCircleIcon,
  CameraIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  MapPinIcon,
  BriefcaseIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline';
import BackButton from '../components/BackButton.js';

interface ProfileData {
  displayName: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  gender: string;
  birthDate: string;
  occupation: string;
  bio: string;
  city: string;
  country: string;
}

interface DBUser {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  gender?: string;
  birthDate?: string;
  occupation?: string;
  bio?: string;
  city?: string;
  country?: string;
  totalCount?: number;
  createdAt?: string;
}

interface UserResponse {
  user?: DBUser;
}

const GENDER_LABEL: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_say: 'Prefer not to say',
};

function calcAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData>({
    displayName: user?.displayName || '',
    firstName: '',
    lastName: '',
    photoUrl: '',
    gender: '',
    birthDate: '',
    occupation: '',
    bio: '',
    city: '',
    country: '',
  });
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const idToken = localStorage.getItem('ihsan_idToken');
    if (!idToken) return;
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
      .then((r) => r.json())
      .then((d: UserResponse) => {
        if (d?.user) {
          setDbUser(d.user);
          setProfile({
            displayName: d.user.displayName || user?.displayName || '',
            firstName: d.user.firstName || '',
            lastName: d.user.lastName || '',
            photoUrl: d.user.photoUrl || '',
            gender: d.user.gender || '',
            birthDate: d.user.birthDate ? d.user.birthDate.substring(0, 10) : '',
            occupation: d.user.occupation || '',
            bio: d.user.bio || '',
            city: d.user.city || '',
            country: d.user.country || '',
          });
          setPreview(d.user.photoUrl || '');
        }
      })
      .catch(() => { /* non-fatal */ });
  }, [user?.displayName]);

  const saveProfile = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError('');
    const idToken = localStorage.getItem('ihsan_idToken');
    if (!idToken) { setSaving(false); return; }
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          displayName: profile.displayName || undefined,
          firstName: profile.firstName || undefined,
          lastName: profile.lastName || undefined,
          photoUrl: profile.photoUrl || undefined,
          gender: profile.gender || undefined,
          birthDate: profile.birthDate || undefined,
          occupation: profile.occupation || undefined,
          bio: profile.bio || undefined,
          city: profile.city || undefined,
          country: profile.country || undefined,
        }),
      });
      const data = await res.json() as UserResponse;
      if (data?.user) {
        setDbUser(data.user);
        const updatedAuthUser = {
          ...(user ?? { uid: '', email: null }),
          displayName: data.user.displayName || profile.displayName,
          photoUrl: data.user.photoUrl || profile.photoUrl,
        };
        setUser(updatedAuthUser);
        localStorage.setItem('ihsan_user', JSON.stringify({
          ...JSON.parse(localStorage.getItem('ihsan_user') || '{}'),
          displayName: updatedAuthUser.displayName,
          photoUrl: updatedAuthUser.photoUrl,
        }));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setSaveError('Failed to save. Please try again.');
    }
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
    } finally {
      setUploading(false);
    }
  };

  const age = calcAge(profile.birthDate);
  const memberSince = dbUser?.createdAt
    ? new Date(dbUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;
  const totalZikr = (dbUser?.totalCount ?? 0).toLocaleString();

  return (
    <AnimatedBackground variant="dark">
      <div className="p-4 sm:p-6 lg:p-8 pb-12">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Back */}
          <div className="flex justify-start"><BackButton /></div>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-3xl sm:text-4xl font-black text-brand-emerald mb-1">My Profile</h1>
            <p className="text-white/40 text-sm">Manage your personal information</p>
          </motion.div>

          {/* Avatar + name block */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card bg-brand-surface border border-brand-border rounded-2xl"
          >
            <div className="card-body p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="avatar">
                    <div className="w-24 rounded-full ring ring-brand-emerald ring-offset-brand-deep ring-offset-2">
                      {preview || profile.photoUrl ? (
                        <img src={preview || profile.photoUrl} alt="profile" />
                      ) : (
                        <div className="w-full h-full bg-brand-emerald/20 flex items-center justify-center">
                          <UserCircleIcon className="w-16 h-16 text-brand-emerald/50" />
                        </div>
                      )}
                    </div>
                  </div>
                  <label className="absolute bottom-0 right-0 btn btn-circle btn-xs bg-brand-emerald hover:bg-brand-emerald-dim text-white border-0 shadow-lg cursor-pointer">
                    {uploading
                      ? <span className="loading loading-spinner loading-xs" />
                      : <CameraIcon className="w-3.5 h-3.5" />
                    }
                    <input type="file" accept="image/*" className="hidden" onChange={onFileChange} disabled={uploading} />
                  </label>
                </div>

                {/* Name + quick info */}
                <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
                  <p className="text-xl font-black text-white leading-tight">
                    {profile.displayName || profile.firstName || user?.email?.split('@')[0] || 'Anonymous'}
                  </p>
                  {(profile.city || profile.country) && (
                    <p className="flex items-center justify-center sm:justify-start gap-1 text-white/40 text-sm">
                      <MapPinIcon className="w-3.5 h-3.5 text-brand-emerald/60" />
                      {[profile.city, profile.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {profile.occupation && (
                    <p className="flex items-center justify-center sm:justify-start gap-1 text-white/40 text-sm">
                      <BriefcaseIcon className="w-3.5 h-3.5" />
                      {profile.occupation}
                    </p>
                  )}
                  {profile.bio && (
                    <p className="text-white/50 text-sm mt-2 italic leading-snug">{profile.bio}</p>
                  )}
                </div>
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-brand-border">
                <div className="text-center">
                  <p className="text-brand-emerald font-black text-lg tabular-nums">{totalZikr}</p>
                  <p className="text-white/30 text-xs uppercase tracking-wide">Total Zikr</p>
                </div>
                <div className="text-center border-x border-brand-border">
                  <p className="text-brand-gold font-black text-lg">
                    {age !== null ? `${age}y` : profile.gender ? GENDER_LABEL[profile.gender]?.split(' ')[0] : '—'}
                  </p>
                  <p className="text-white/30 text-xs uppercase tracking-wide">
                    {age !== null ? 'Age' : 'Gender'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-white/60 font-black text-sm leading-tight">{memberSince ?? '—'}</p>
                  <p className="text-white/30 text-xs uppercase tracking-wide">Member since</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Account info (read-only) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="card bg-brand-surface border border-brand-border rounded-2xl"
          >
            <div className="card-body p-5 sm:p-6 space-y-3">
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-1">Account</p>
              <div className="flex items-center gap-3 py-2 border-b border-brand-border/50">
                <EnvelopeIcon className="w-4 h-4 text-white/30 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white/30 text-xs">Email</p>
                  <p className="text-white/60 text-sm truncate">{user?.email ?? '—'}</p>
                </div>
                <span className="badge badge-xs bg-brand-border text-white/30 border-none">read-only</span>
              </div>
              <div className="flex items-center gap-3 py-2">
                <HashtagIcon className="w-4 h-4 text-white/30 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white/30 text-xs">User ID</p>
                  <p className="text-white/30 text-xs font-mono truncate">{user?.uid ?? '—'}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Edit form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.11 }}
            className="card bg-brand-surface border border-brand-border rounded-2xl"
          >
            <div className="card-body p-5 sm:p-6 space-y-4">
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Edit Details</p>

              {/* Display name */}
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-white/60 text-sm">Display Name</span></label>
                <input
                  className="input input-sm input-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald focus:outline-none"
                  placeholder="How you appear in the app"
                  value={profile.displayName}
                  onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                />
              </div>

              {/* First / Last name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-white/60 text-sm">First Name</span></label>
                  <input
                    className="input input-sm input-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald focus:outline-none"
                    placeholder="First"
                    value={profile.firstName}
                    onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                  />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-white/60 text-sm">Last Name</span></label>
                  <input
                    className="input input-sm input-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald focus:outline-none"
                    placeholder="Last"
                    value={profile.lastName}
                    onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-white/60 text-sm">Bio</span>
                  <span className="label-text-alt text-white/20 text-xs">{profile.bio.length}/250</span>
                </label>
                <textarea
                  className="textarea textarea-bordered bg-brand-deep border-brand-border text-white text-sm focus:border-brand-emerald focus:outline-none resize-none"
                  placeholder="A short sentence about yourself…"
                  rows={2}
                  maxLength={250}
                  value={profile.bio}
                  onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                />
              </div>

              {/* City / Country */}
              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-white/60 text-sm flex items-center gap-1">
                      <MapPinIcon className="w-3.5 h-3.5" /> City
                    </span>
                  </label>
                  <input
                    className="input input-sm input-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald focus:outline-none"
                    placeholder="e.g. Dhaka"
                    value={profile.city}
                    onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                  />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-white/60 text-sm">Country</span></label>
                  <input
                    className="input input-sm input-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald focus:outline-none"
                    placeholder="e.g. Bangladesh"
                    value={profile.country}
                    onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
                  />
                </div>
              </div>

              {/* Occupation / Gender / Birth date */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-white/60 text-sm flex items-center gap-1">
                    <BriefcaseIcon className="w-3.5 h-3.5" /> Occupation
                  </span>
                </label>
                <input
                  className="input input-sm input-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald focus:outline-none"
                  placeholder="Your profession or field"
                  value={profile.occupation}
                  onChange={(e) => setProfile((p) => ({ ...p, occupation: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-white/60 text-sm">Gender</span></label>
                  <select
                    className="select select-sm select-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald focus:outline-none"
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
                  <label className="label py-1">
                    <span className="label-text text-white/60 text-sm flex items-center gap-1">
                      <CalendarDaysIcon className="w-3.5 h-3.5" /> Birth Date
                    </span>
                  </label>
                  <input
                    type="date"
                    className="input input-sm input-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald focus:outline-none"
                    value={profile.birthDate}
                    onChange={(e) => setProfile((p) => ({ ...p, birthDate: e.target.value }))}
                  />
                </div>
              </div>

              {saveError && <p className="text-red-400 text-xs">{saveError}</p>}

              <button
                className="btn btn-sm w-full bg-brand-emerald hover:bg-brand-emerald-dim text-white border-0 mt-1 gap-2"
                onClick={saveProfile}
                disabled={uploading || saving}
              >
                {saving ? (
                  <><span className="loading loading-spinner loading-xs" /> Saving…</>
                ) : saved ? (
                  <><CheckCircleIcon className="w-4 h-4" /> Saved!</>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </AnimatedBackground>
  );
}
