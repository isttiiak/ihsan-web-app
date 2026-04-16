import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { storage } from '../firebase.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';
import {
  UserCircleIcon,
  CameraIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  MapPinIcon,
  BriefcaseIcon,
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

function calcAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export default function Profile() {
  const { user, setUser } = useAuthStore();

  // Parse first/last name from Google display name as initial placeholder values
  const googleFirstName = useMemo(() => {
    const parts = (user?.displayName ?? '').trim().split(' ');
    return parts[0] ?? '';
  }, [user?.displayName]);
  const googleLastName = useMemo(() => {
    const parts = (user?.displayName ?? '').trim().split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }, [user?.displayName]);

  const [profile, setProfile] = useState<ProfileData>({
    displayName: user?.displayName || '',
    firstName: '',
    lastName: '',
    photoUrl: user?.photoUrl || '',
    gender: '',
    birthDate: '',
    occupation: '',
    bio: '',
    city: '',
    country: '',
  });
  const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(null);
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(user?.photoUrl || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const saveSuccessTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          const loaded: ProfileData = {
            displayName: d.user.displayName || user?.displayName || '',
            firstName: d.user.firstName || googleFirstName,
            lastName: d.user.lastName || googleLastName,
            photoUrl: d.user.photoUrl || user?.photoUrl || '',
            gender: d.user.gender || '',
            birthDate: d.user.birthDate ? d.user.birthDate.substring(0, 10) : '',
            occupation: d.user.occupation || '',
            bio: d.user.bio || '',
            city: d.user.city || '',
            country: d.user.country || '',
          };
          setProfile(loaded);
          setOriginalProfile(loaded);
          setPreview(d.user.photoUrl || user?.photoUrl || '');
        }
      })
      .catch(() => { /* non-fatal */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dirty detection — save button is highlighted only when something changed
  const isDirty = useMemo(() => {
    if (!originalProfile) return false;
    return (Object.keys(profile) as Array<keyof ProfileData>).some(
      (k) => profile[k] !== originalProfile[k]
    );
  }, [profile, originalProfile]);

  const saveProfile = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    setSaveSuccess(false);
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
        setOriginalProfile({ ...profile });
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
        setSaveSuccess(true);
        if (saveSuccessTimeout.current) clearTimeout(saveSuccessTimeout.current);
        saveSuccessTimeout.current = setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      setSaveError('Failed to save. Please try again.');
    }
    setSaving(false);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
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

  const field = (
    key: keyof ProfileData,
    label: string,
    opts?: { placeholder?: string; type?: string; icon?: React.ReactNode }
  ) => (
    <div className="form-control">
      <label className="label py-1">
        <span className="label-text text-white/60 text-sm flex items-center gap-1">
          {opts?.icon}{label}
        </span>
      </label>
      <input
        type={opts?.type ?? 'text'}
        className="input input-sm input-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald focus:outline-none transition-colors"
        placeholder={opts?.placeholder ?? ''}
        value={profile[key]}
        onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  );

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

          {/* Avatar + summary card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card bg-brand-surface border border-brand-border rounded-2xl"
          >
            <div className="card-body p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Avatar with upload */}
                <div className="relative shrink-0">
                  <div className="avatar">
                    <div className="w-24 rounded-full ring ring-brand-emerald ring-offset-brand-deep ring-offset-2">
                      {preview || profile.photoUrl ? (
                        <img src={preview || profile.photoUrl} alt="profile" className="object-cover" />
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

                {/* Name + info */}
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

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-brand-border">
                <div className="text-center">
                  <p className="text-brand-emerald font-black text-lg tabular-nums">{totalZikr}</p>
                  <p className="text-white/30 text-xs uppercase tracking-wide">Total Zikr</p>
                </div>
                <div className="text-center border-x border-brand-border">
                  <p className="text-brand-gold font-black text-lg">
                    {age !== null ? `${age}y` : '—'}
                  </p>
                  <p className="text-white/30 text-xs uppercase tracking-wide">Age</p>
                </div>
                <div className="text-center">
                  <p className="text-white/60 font-black text-sm leading-tight">{memberSince ?? '—'}</p>
                  <p className="text-white/30 text-xs uppercase tracking-wide">Member</p>
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
            <div className="card-body p-5 sm:p-6">
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-3">Account</p>
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="w-4 h-4 text-white/30 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white/30 text-xs">Email</p>
                  <p className="text-white/60 text-sm truncate">{user?.email ?? '—'}</p>
                </div>
                <span className="badge badge-xs bg-brand-border text-white/30 border-none shrink-0">read-only</span>
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
              {field('displayName', 'Display Name', { placeholder: 'How you appear in the app (used for greeting)' })}

              {/* First / Last name */}
              <div className="grid grid-cols-2 gap-3">
                {field('firstName', 'First Name', { placeholder: googleFirstName || 'First' })}
                {field('lastName', 'Last Name', { placeholder: googleLastName || 'Last' })}
              </div>

              {/* Bio */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-white/60 text-sm">Bio</span>
                  <span className="label-text-alt text-white/20 text-xs">{profile.bio.length}/250</span>
                </label>
                <textarea
                  className="textarea textarea-bordered bg-brand-deep border-brand-border text-white text-sm focus:border-brand-emerald focus:outline-none resize-none transition-colors"
                  placeholder="A short sentence about yourself…"
                  rows={2}
                  maxLength={250}
                  value={profile.bio}
                  onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                />
              </div>

              {/* City / Country */}
              <div className="grid grid-cols-2 gap-3">
                {field('city', 'City', { placeholder: 'e.g. Dhaka', icon: <MapPinIcon className="w-3.5 h-3.5" /> })}
                {field('country', 'Country', { placeholder: 'e.g. Bangladesh' })}
              </div>

              {/* Occupation */}
              {field('occupation', 'Occupation', { placeholder: 'Your profession or field', icon: <BriefcaseIcon className="w-3.5 h-3.5" /> })}

              {/* Gender / Birth date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-white/60 text-sm">Gender</span></label>
                  <select
                    className="select select-sm select-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald focus:outline-none transition-colors"
                    value={profile.gender}
                    onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}
                  >
                    <option value="">Not set</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
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
                    className="input input-sm input-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald focus:outline-none transition-colors"
                    value={profile.birthDate}
                    onChange={(e) => setProfile((p) => ({ ...p, birthDate: e.target.value }))}
                  />
                </div>
              </div>

              {saveError && <p className="text-red-400 text-xs">{saveError}</p>}

              {/* Save button — dim when nothing changed, bright when dirty */}
              <button
                className={`btn btn-sm w-full mt-1 gap-2 transition-all duration-300 border-0 ${
                  isDirty
                    ? 'bg-brand-emerald hover:bg-brand-emerald-dim text-white shadow-[0_0_16px_rgba(16,185,129,0.4)]'
                    : 'bg-brand-surface border border-brand-border text-white/30 cursor-not-allowed'
                }`}
                onClick={saveProfile}
                disabled={!isDirty || saving}
              >
                {saving ? (
                  <><span className="loading loading-spinner loading-xs" /> Saving…</>
                ) : (
                  'Save Changes'
                )}
              </button>

              {/* Success animation */}
              <AnimatePresence>
                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 18 }}
                    className="flex items-center justify-center gap-2 py-2 rounded-xl bg-brand-emerald/15 border border-brand-emerald/30"
                  >
                    <CheckCircleIcon className="w-4 h-4 text-brand-emerald" />
                    <span className="text-brand-emerald text-sm font-semibold">Profile saved!</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </div>
    </AnimatedBackground>
  );
}
