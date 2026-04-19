import React, { useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { useQueryClient } from '@tanstack/react-query';
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
  XMarkIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAnalytics } from '../hooks/useAnalytics.js';
import { useZikrStore } from '../store/useZikrStore.js';

// ── Country → Cities data ─────────────────────────────────────────────────────
const COUNTRIES_CITIES: Record<string, string[]> = {
  'Afghanistan': ['Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Kunduz'],
  'Algeria': ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna'],
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra'],
  'Azerbaijan': ['Baku', 'Ganja', 'Sumqayit'],
  'Bangladesh': ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Mymensingh', 'Comilla', 'Rangpur', 'Narayanganj'],
  'Belgium': ['Brussels', 'Antwerp', 'Ghent', 'Liège', 'Bruges'],
  'Bosnia and Herzegovina': ['Sarajevo', 'Banja Luka', 'Tuzla', 'Zenica'],
  'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Manaus'],
  'Brunei': ['Bandar Seri Begawan', 'Kuala Belait', 'Seria'],
  'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Mississauga'],
  'China': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', "Xi'an", 'Urumqi', 'Kunming'],
  'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Port Said', 'Luxor', 'Aswan', 'Sharm el-Sheikh'],
  'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Strasbourg', 'Bordeaux', 'Nantes'],
  'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Bremen'],
  'Ghana': ['Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Sekondi-Takoradi'],
  'India': ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Ahmedabad', 'Pune', 'Surat', 'Lucknow', 'Jaipur', 'Srinagar'],
  'Indonesia': ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Yogyakarta'],
  'Iran': ['Tehran', 'Mashhad', 'Isfahan', 'Karaj', 'Tabriz', 'Shiraz', 'Ahvaz'],
  'Iraq': ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Najaf', 'Karbala', 'Sulaymaniyah'],
  'Jordan': ['Amman', 'Zarqa', 'Irbid', 'Aqaba', 'Madaba'],
  'Kazakhstan': ['Almaty', 'Astana', 'Shymkent', 'Karaganda'],
  'Kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
  'Kuwait': ['Kuwait City', 'Hawalli', 'Salmiya', 'Farwaniya', 'Jahra'],
  'Kyrgyzstan': ['Bishkek', 'Osh', 'Jalal-Abad'],
  'Lebanon': ['Beirut', 'Tripoli', 'Sidon', 'Tyre', 'Baalbek'],
  'Libya': ['Tripoli', 'Benghazi', 'Misrata', 'Bayda'],
  'Malaysia': ['Kuala Lumpur', 'George Town', 'Johor Bahru', 'Ipoh', 'Shah Alam', 'Petaling Jaya', 'Kota Kinabalu'],
  'Maldives': ['Malé', 'Addu City', 'Fuvahmulah'],
  'Mali': ['Bamako', 'Sikasso', 'Mopti', 'Timbuktu'],
  'Mauritania': ['Nouakchott', 'Nouadhibou', 'Rosso'],
  'Morocco': ['Casablanca', 'Rabat', 'Fez', 'Marrakech', 'Agadir', 'Tangier', 'Meknes', 'Oujda'],
  'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
  'Niger': ['Niamey', 'Zinder', 'Maradi', 'Agadez'],
  'Nigeria': ['Lagos', 'Kano', 'Ibadan', 'Abuja', 'Port Harcourt', 'Kaduna', 'Benin City', 'Maiduguri'],
  'Oman': ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur'],
  'Pakistan': ['Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Islamabad', 'Gujranwala', 'Peshawar', 'Multan', 'Hyderabad', 'Quetta', 'Sialkot'],
  'Palestine': ['Gaza', 'Jerusalem', 'Ramallah', 'Hebron', 'Nablus', 'Jenin'],
  'Philippines': ['Manila', 'Quezon City', 'Davao', 'Cebu', 'Zamboanga', 'Cotabato'],
  'Qatar': ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor'],
  'Russia': ['Moscow', 'Saint Petersburg', 'Kazan', 'Ufa', 'Novosibirsk', 'Grozny', 'Makhachkala'],
  'Saudi Arabia': ["Riyadh", 'Jeddah', 'Mecca', 'Medina', 'Dammam', "Ta'if", 'Tabuk', 'Abha'],
  'Senegal': ['Dakar', 'Touba', 'Thiès', 'Kaolack', 'Saint-Louis'],
  'Sierra Leone': ['Freetown', 'Bo', 'Kenema'],
  'Somalia': ['Mogadishu', 'Hargeisa', 'Bosaso', 'Kismayo', 'Berbera'],
  'South Africa': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'],
  'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao', 'Málaga', 'Zaragoza'],
  'Sudan': ['Khartoum', 'Omdurman', 'Port Sudan', 'Kassala', 'Obeid'],
  'Syria': ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama'],
  'Tajikistan': ['Dushanbe', 'Khujand', 'Kulob', 'Qurghonteppa'],
  'Tanzania': ['Dar es Salaam', 'Zanzibar City', 'Mwanza', 'Arusha', 'Dodoma'],
  'Tunisia': ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte'],
  'Turkey': ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Mersin', 'Diyarbakır'],
  'Turkmenistan': ['Ashgabat', 'Turkmenabat', 'Dashoguz'],
  'Uganda': ['Kampala', 'Gulu', 'Lira', 'Mbarara', 'Jinja'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain', 'Ras al-Khaimah', 'Fujairah'],
  'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Leeds', 'Glasgow', 'Liverpool', 'Newcastle', 'Sheffield', 'Bradford', 'Leicester'],
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Detroit', 'Dearborn', 'Jersey City', 'Paterson'],
  'Uzbekistan': ['Tashkent', 'Samarkand', 'Namangan', 'Andijan', 'Bukhara', 'Fergana'],
  'Yemen': ['Sanaa', 'Aden', 'Taiz', 'Hudaydah', 'Mukalla', 'Ibb'],
};

const SORTED_COUNTRIES = Object.keys(COUNTRIES_CITIES).sort();

const COUNTRY_CODES: Record<string, string> = {
  'Afghanistan': 'AF', 'Algeria': 'DZ', 'Australia': 'AU', 'Azerbaijan': 'AZ',
  'Bangladesh': 'BD', 'Belgium': 'BE', 'Bosnia and Herzegovina': 'BA', 'Brazil': 'BR',
  'Brunei': 'BN', 'Canada': 'CA', 'China': 'CN', 'Egypt': 'EG', 'France': 'FR',
  'Germany': 'DE', 'Ghana': 'GH', 'India': 'IN', 'Indonesia': 'ID', 'Iran': 'IR',
  'Iraq': 'IQ', 'Jordan': 'JO', 'Kazakhstan': 'KZ', 'Kenya': 'KE', 'Kuwait': 'KW',
  'Kyrgyzstan': 'KG', 'Lebanon': 'LB', 'Libya': 'LY', 'Malaysia': 'MY', 'Maldives': 'MV',
  'Mali': 'ML', 'Mauritania': 'MR', 'Morocco': 'MA', 'Netherlands': 'NL', 'Niger': 'NE',
  'Nigeria': 'NG', 'Oman': 'OM', 'Pakistan': 'PK', 'Palestine': 'PS', 'Philippines': 'PH',
  'Qatar': 'QA', 'Russia': 'RU', 'Saudi Arabia': 'SA', 'Senegal': 'SN', 'Sierra Leone': 'SL',
  'Somalia': 'SO', 'South Africa': 'ZA', 'Spain': 'ES', 'Sudan': 'SD', 'Syria': 'SY',
  'Tajikistan': 'TJ', 'Tanzania': 'TZ', 'Tunisia': 'TN', 'Turkey': 'TR', 'Turkmenistan': 'TM',
  'Uganda': 'UG', 'United Arab Emirates': 'AE', 'United Kingdom': 'GB', 'United States': 'US',
  'Uzbekistan': 'UZ', 'Yemen': 'YE',
};

function countryFlag(countryName: string): string {
  const code = COUNTRY_CODES[countryName];
  if (!code) return '';
  return Array.from(code).map((c) => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
}

// ── Preset avatars ────────────────────────────────────────────────────────────
const PRESET_AVATARS = [
  { id: 'sun',       emoji: '☀️',  label: 'Sun',        bg: '#92400e' },
  { id: 'moon',      emoji: '🌙',  label: 'Moon',       bg: '#312e81' },
  { id: 'star',      emoji: '⭐',  label: 'Star',       bg: '#1e3a5f' },
  { id: 'glowstar',  emoji: '🌟',  label: 'Glow Star',  bg: '#3b1f63' },
  { id: 'rose',      emoji: '🌹',  label: 'Rose',       bg: '#7f1d1d' },
  { id: 'tulip',     emoji: '🌷',  label: 'Tulip',      bg: '#831843' },
  { id: 'sunflower', emoji: '🌻',  label: 'Sunflower',  bg: '#713f12' },
  { id: 'blossom',   emoji: '🌸',  label: 'Blossom',    bg: '#9d174d' },
  { id: 'leaf',      emoji: '🌿',  label: 'Leaf',       bg: '#064e3b' },
  { id: 'tree',      emoji: '🌳',  label: 'Tree',       bg: '#14532d' },
  { id: 'palm',      emoji: '🌴',  label: 'Palm',       bg: '#365314' },
  { id: 'mountain',  emoji: '⛰️',  label: 'Mountain',   bg: '#292524' },
  { id: 'ocean',     emoji: '🌊',  label: 'Ocean',      bg: '#0c4a6e' },
  { id: 'diamond',   emoji: '💎',  label: 'Diamond',    bg: '#164e63' },
  { id: 'crystal',   emoji: '🔮',  label: 'Crystal',    bg: '#2e1065' },
  { id: 'rainbow',   emoji: '🌈',  label: 'Rainbow',    bg: '#3b0764' },
] as const;

function createAvatarDataUrl(emoji: string, bg: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(100, 100, 100, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '90px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 100, 108);
  return canvas.toDataURL('image/png');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcFullAge(birthDate: string): { years: number; months: number } | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months--;
  if (months < 0) { years--; months += 12; }
  if (years < 0) return null;
  return { years, months };
}

function formatFullDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

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

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const { data: analyticsData } = useAnalytics(1);
  const { resetAll: resetZikrStore } = useZikrStore();
  const queryClient = useQueryClient();

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
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const saveSuccessTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load prayer-times location for city/country pre-fill
  const locationFromStorage = useMemo(() => {
    try {
      const s = localStorage.getItem('ihsan_location');
      if (!s) return null;
      return JSON.parse(s) as { latitude: number; longitude: number; name?: string };
    } catch { return null; }
  }, []);

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
          // Pre-fill city/country from prayer-times location if DB has none
          let city = d.user.city || '';
          let country = d.user.country || '';
          if (!city && !country && locationFromStorage?.name) {
            const parts = locationFromStorage.name.split(', ');
            if (parts.length >= 2) {
              city = parts[0] ?? '';
              country = parts[parts.length - 1] ?? '';
            }
          }
          const loaded: ProfileData = {
            displayName: d.user.displayName || user?.displayName || '',
            firstName: d.user.firstName || googleFirstName,
            lastName: d.user.lastName || googleLastName,
            photoUrl: d.user.photoUrl || user?.photoUrl || '',
            gender: d.user.gender || '',
            birthDate: d.user.birthDate ? d.user.birthDate.substring(0, 10) : '',
            occupation: d.user.occupation || '',
            bio: d.user.bio || '',
            city,
            country,
          };
          setProfile(loaded);
          setOriginalProfile(loaded);
          setPreview(d.user.photoUrl || user?.photoUrl || '');
        }
      })
      .catch(() => { /* non-fatal */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        saveSuccessTimeout.current = setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError('Save failed. Please try again.');
      }
    } catch {
      setSaveError('Failed to save. Please check your connection.');
    }
    setSaving(false);
  };

  const compressImage = (file: File): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const src = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 400;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(src); reject(new Error('canvas')); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(src);
          if (blob) resolve(blob); else reject(new Error('compression'));
        }, 'image/jpeg', 0.75);
      };
      img.onerror = () => { URL.revokeObjectURL(src); reject(new Error('load')); };
      img.src = src;
    });

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setSaveError('');
    try {
      const blob = await compressImage(file);
      setPhotoBlob(blob);
      setPhotoPreviewUrl(URL.createObjectURL(blob));
      setPhotoModalOpen(true);
    } catch {
      setSaveError('Could not process image. Try a different file.');
    }
  };

  const uploadPhoto = async () => {
    if (!photoBlob) return;
    setSaveError('');
    setUploading(true);
    try {
      const uid = user?.uid || 'anon';
      const fileRef = ref(storage, `profile/${uid}/${Date.now()}.jpg`);
      await uploadBytes(fileRef, photoBlob);
      const url = await getDownloadURL(fileRef);
      setPreview(url);
      setProfile((p) => ({ ...p, photoUrl: url }));
      setPhotoModalOpen(false);
      URL.revokeObjectURL(photoPreviewUrl);
      setPhotoBlob(null);
      setPhotoPreviewUrl('');
      const idToken = localStorage.getItem('ihsan_idToken');
      if (idToken) {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/me`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ photoUrl: url }),
        });
        if (res.ok) {
          setOriginalProfile((p) => p ? { ...p, photoUrl: url } : null);
          const updated = { ...(user ?? { uid: '', email: null }), displayName: user?.displayName ?? null, photoUrl: url };
          setUser(updated);
          localStorage.setItem('ihsan_user', JSON.stringify({ ...JSON.parse(localStorage.getItem('ihsan_user') || '{}'), photoUrl: url }));
        } else {
          setSaveError('Uploaded but could not save — click "Save Changes" to retry.');
        }
      }
    } catch {
      setSaveError('Upload failed. Check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  const cancelPhotoModal = () => {
    URL.revokeObjectURL(photoPreviewUrl);
    setPhotoModalOpen(false);
    setPhotoBlob(null);
    setPhotoPreviewUrl('');
  };

  const handleCameraClick = async () => {
    const result = await Swal.fire({
      title: 'Change Profile Photo',
      text: 'How would you like to update your photo?',
      showConfirmButton: true,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: '📷 Upload Photo',
      denyButtonText: '🎨 Choose Avatar',
      cancelButtonText: 'Cancel',
      background: '#141e2e',
      color: '#f1f5f9',
      confirmButtonColor: '#10b981',
      denyButtonColor: '#6366f1',
      cancelButtonColor: '#1e2d42',
      customClass: { popup: 'rounded-3xl border border-[#1e2d42]' },
    });
    if (result.isConfirmed) fileInputRef.current?.click();
    else if (result.isDenied) setAvatarModalOpen(true);
  };

  const selectAvatar = async (av: { emoji: string; bg: string }) => {
    const dataUrl = createAvatarDataUrl(av.emoji, av.bg);
    if (!dataUrl) return;
    setSaveError('');
    setUploading(true);
    try {
      setPreview(dataUrl);
      setProfile((p) => ({ ...p, photoUrl: dataUrl }));
      setAvatarModalOpen(false);
      const idToken = localStorage.getItem('ihsan_idToken');
      if (idToken) {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/me`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ photoUrl: dataUrl }),
        });
        if (res.ok) {
          setOriginalProfile((p) => p ? { ...p, photoUrl: dataUrl } : null);
          const updated = { ...(user ?? { uid: '', email: null }), displayName: user?.displayName ?? null, photoUrl: dataUrl };
          setUser(updated);
          localStorage.setItem('ihsan_user', JSON.stringify({
            ...JSON.parse(localStorage.getItem('ihsan_user') || '{}'),
            photoUrl: dataUrl,
          }));
        }
      }
    } catch {
      setSaveError('Failed to save avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const deleteSalatLogs = async () => {
    const first = await Swal.fire({
      title: 'Delete all Salat logs?',
      html: 'This will <b>permanently delete</b> all your prayer tracking history. The Salat Tracker will start fresh from today.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      background: '#141e2e',
      color: '#f1f5f9',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#1e2d42',
      customClass: { popup: 'rounded-3xl border border-[#1e2d42]' },
    });
    if (!first.isConfirmed) return;

    const second = await Swal.fire({
      title: 'Are you absolutely sure?',
      text: 'This action cannot be undone.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Delete forever',
      cancelButtonText: 'Cancel',
      background: '#141e2e',
      color: '#f1f5f9',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#1e2d42',
      customClass: { popup: 'rounded-3xl border border-[#1e2d42]' },
    });
    if (!second.isConfirmed) return;

    const idToken = localStorage.getItem('ihsan_idToken');
    if (!idToken) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/salat/all`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        // Record deletion date — SalatTracker uses this to block back-navigation before it
        const d = new Date();
        const localToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        localStorage.setItem('ihsan_salat_start_date', localToday);
        // Invalidate all salat-related React Query caches so UI reflects empty state
        await queryClient.invalidateQueries({ queryKey: ['salat'] });
        await Swal.fire({ title: 'Deleted', text: 'All salat logs have been removed.', icon: 'success', background: '#141e2e', color: '#f1f5f9', confirmButtonColor: '#10b981', customClass: { popup: 'rounded-3xl border border-[#1e2d42]' } });
      } else {
        await Swal.fire({ title: 'Error', text: 'Could not delete. Try again.', icon: 'error', background: '#141e2e', color: '#f1f5f9', confirmButtonColor: '#ef4444', customClass: { popup: 'rounded-3xl border border-[#1e2d42]' } });
      }
    } catch {
      await Swal.fire({ title: 'Network error', text: 'Check your connection and try again.', icon: 'error', background: '#141e2e', color: '#f1f5f9', confirmButtonColor: '#ef4444', customClass: { popup: 'rounded-3xl border border-[#1e2d42]' } });
    }
  };

  const deleteZikrData = async () => {
    const first = await Swal.fire({
      title: 'Delete all Zikr data?',
      html: 'This will <b>permanently delete</b> all your zikr counts, streaks, and history. Your goal setting will be kept.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      background: '#141e2e',
      color: '#f1f5f9',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#1e2d42',
      customClass: { popup: 'rounded-3xl border border-[#1e2d42]' },
    });
    if (!first.isConfirmed) return;

    const second = await Swal.fire({
      title: 'Are you absolutely sure?',
      text: 'Streak, lifetime totals, and all daily counts will be erased permanently.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Delete forever',
      cancelButtonText: 'Cancel',
      background: '#141e2e',
      color: '#f1f5f9',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#1e2d42',
      customClass: { popup: 'rounded-3xl border border-[#1e2d42]' },
    });
    if (!second.isConfirmed) return;

    const idToken = localStorage.getItem('ihsan_idToken');
    if (!idToken) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/zikr/all`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        resetZikrStore(); // clear local Zustand optimistic state
        // Invalidate all analytics + zikr React Query caches so UI reflects zeroed state
        await queryClient.invalidateQueries({ queryKey: ['analytics'] });
        await queryClient.invalidateQueries({ queryKey: ['zikr'] });
        await Swal.fire({ title: 'Deleted', text: 'All zikr data has been removed.', icon: 'success', background: '#141e2e', color: '#f1f5f9', confirmButtonColor: '#10b981', customClass: { popup: 'rounded-3xl border border-[#1e2d42]' } });
      } else {
        await Swal.fire({ title: 'Error', text: 'Could not delete. Try again.', icon: 'error', background: '#141e2e', color: '#f1f5f9', confirmButtonColor: '#ef4444', customClass: { popup: 'rounded-3xl border border-[#1e2d42]' } });
      }
    } catch {
      await Swal.fire({ title: 'Network error', text: 'Check your connection and try again.', icon: 'error', background: '#141e2e', color: '#f1f5f9', confirmButtonColor: '#ef4444', customClass: { popup: 'rounded-3xl border border-[#1e2d42]' } });
    }
  };

  const ageInfo = calcFullAge(profile.birthDate);
  const totalZikr = (dbUser?.totalCount ?? 0).toLocaleString();
  const longestStreak = analyticsData?.streak?.longestStreak ?? null;
  const memberSince = dbUser?.createdAt ? formatFullDate(dbUser.createdAt) : null;

  // City list for selected country
  const cityOptions = profile.country ? (COUNTRIES_CITIES[profile.country] ?? []) : [];

  const handleCountryChange = (country: string) => {
    setProfile((p) => ({ ...p, country, city: '' })); // clear city when country changes
  };

  return (
    <>
    <AnimatedBackground variant="dark">
      <div className="p-4 sm:p-6 lg:p-8 pb-16">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-3xl sm:text-4xl font-black text-brand-emerald mb-1">My Profile</h1>
            <p className="text-white/40 text-sm">Manage your personal information</p>
          </motion.div>

          {/* Avatar + summary card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="card bg-brand-surface border border-brand-border rounded-2xl"
          >
            <div className="card-body p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Avatar */}
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
                  <button
                    type="button"
                    onClick={() => void handleCameraClick()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 group w-8 h-8 rounded-full bg-brand-emerald hover:bg-brand-emerald-dim text-white shadow-lg flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <CameraIcon className="w-4 h-4" />
                    <span className="absolute -top-7 right-0 bg-brand-deep border border-brand-border text-white/70 text-[10px] px-2 py-0.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      Change Photo
                    </span>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
                  <p className="text-xl font-black text-white leading-tight flex items-center gap-2 flex-wrap">
                    {profile.displayName || profile.firstName || user?.email?.split('@')[0] || 'Anonymous'}
                    {profile.country && (
                      <span className="text-lg" title={profile.country}>{countryFlag(profile.country)}</span>
                    )}
                  </p>
                  {(profile.city || profile.country) && (
                    <p className="flex items-center justify-center sm:justify-start gap-1 text-white/40 text-sm">
                      <MapPinIcon className="w-3.5 h-3.5 text-brand-emerald/60" />
                      {[profile.city, profile.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {profile.occupation && (
                    <p className="flex items-center justify-center sm:justify-start gap-1 text-white/40 text-sm">
                      <BriefcaseIcon className="w-3.5 h-3.5" /> {profile.occupation}
                    </p>
                  )}
                  {profile.bio && (
                    <p className="text-white/50 text-sm mt-2 italic leading-snug">{profile.bio}</p>
                  )}
                </div>
              </div>

              {/* Quick stats — 4 columns */}
              <div className="grid grid-cols-4 gap-2 mt-5 pt-5 border-t border-brand-border">
                <div className="text-center">
                  <p className="text-brand-emerald font-black text-base tabular-nums">{totalZikr}</p>
                  <p className="text-white/30 text-[10px] uppercase tracking-wide leading-tight mt-0.5">Total Zikr</p>
                </div>
                <div className="text-center border-x border-brand-border">
                  <p className="text-brand-gold font-black text-base">
                    {longestStreak !== null ? longestStreak : '—'}
                  </p>
                  <p className="text-white/30 text-[10px] uppercase tracking-wide leading-tight mt-0.5">Best Streak</p>
                </div>
                <div className="text-center border-r border-brand-border">
                  <p className="text-white/70 font-black text-base leading-tight">
                    {ageInfo ? `${ageInfo.years}y ${ageInfo.months}m` : '—'}
                  </p>
                  <p className="text-white/30 text-[10px] uppercase tracking-wide leading-tight mt-0.5">Age</p>
                </div>
                <div className="text-center">
                  <p className="text-white/50 font-bold text-xs leading-tight">
                    {memberSince ?? '—'}
                  </p>
                  <p className="text-white/30 text-[10px] uppercase tracking-wide leading-tight mt-0.5">Member Since</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Account info (read-only) */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
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
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}
            className="card bg-brand-surface border border-brand-border rounded-2xl"
          >
            <div className="card-body p-5 sm:p-6 space-y-4">
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Edit Details</p>

              {/* Save success banner at top of form */}
              <AnimatePresence>
                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-brand-emerald/15 border border-brand-emerald/40"
                  >
                    <CheckCircleIcon className="w-4 h-4 text-brand-emerald shrink-0" />
                    <span className="text-brand-emerald text-sm font-semibold">Profile saved successfully!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Display name */}
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-white/60 text-sm">Display Name</span></label>
                <input
                  type="text"
                  className="input input-sm input-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald focus:outline-none transition-colors"
                  placeholder="How you appear in the app"
                  value={profile.displayName}
                  onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                />
              </div>

              {/* First / Last name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-white/60 text-sm">First Name</span></label>
                  <input type="text" className="input input-sm input-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald focus:outline-none transition-colors"
                    placeholder={googleFirstName || 'First'} value={profile.firstName}
                    onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-white/60 text-sm">Last Name</span></label>
                  <input type="text" className="input input-sm input-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald focus:outline-none transition-colors"
                    placeholder={googleLastName || 'Last'} value={profile.lastName}
                    onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))} />
                </div>
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

              {/* Country → City dropdowns */}
              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-white/60 text-sm flex items-center gap-1">
                      <MapPinIcon className="w-3.5 h-3.5" /> Country
                    </span>
                  </label>
                  <select
                    className="select select-sm select-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald focus:outline-none transition-colors"
                    value={profile.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                  >
                    <option value="">Select country</option>
                    {SORTED_COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-white/60 text-sm">City</span>
                  </label>
                  {cityOptions.length > 0 ? (
                    <select
                      className="select select-sm select-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald focus:outline-none transition-colors"
                      value={profile.city}
                      onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                    >
                      <option value="">Select city</option>
                      {cityOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="input input-sm input-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald focus:outline-none transition-colors"
                      placeholder={profile.country ? 'Enter city' : 'Select country first'}
                      value={profile.city}
                      onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                    />
                  )}
                </div>
              </div>

              {/* Occupation */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-white/60 text-sm flex items-center gap-1">
                    <BriefcaseIcon className="w-3.5 h-3.5" /> Occupation
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-sm input-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald focus:outline-none transition-colors"
                  placeholder="Your profession or field"
                  value={profile.occupation}
                  onChange={(e) => setProfile((p) => ({ ...p, occupation: e.target.value }))}
                />
              </div>

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
                    {profile.birthDate && (
                      <button
                        type="button"
                        className="label-text-alt flex items-center gap-0.5 text-white/30 hover:text-red-400 text-xs transition-colors"
                        onClick={() => setProfile((p) => ({ ...p, birthDate: '' }))}
                        title="Clear birth date"
                      >
                        <XMarkIcon className="w-3 h-3" /> Clear
                      </button>
                    )}
                  </label>
                  <input
                    type="date"
                    className="input input-sm input-bordered bg-brand-deep border-brand-border text-white focus:border-brand-emerald focus:outline-none transition-colors [color-scheme:dark]"
                    value={profile.birthDate}
                    max={new Date().toISOString().substring(0, 10)}
                    onChange={(e) => setProfile((p) => ({ ...p, birthDate: e.target.value }))}
                  />
                  {ageInfo && (
                    <p className="text-white/30 text-xs mt-1">
                      Age: {ageInfo.years} years, {ageInfo.months} month{ageInfo.months !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              {saveError && <p className="text-red-400 text-xs">{saveError}</p>}

              {/* Save button */}
              <button
                className={`btn btn-sm w-full mt-1 gap-2 transition-all duration-300 border-0 ${
                  isDirty && !saving
                    ? 'bg-brand-emerald hover:bg-brand-emerald-dim text-white shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                    : 'bg-brand-surface border border-brand-border text-white/30 cursor-not-allowed'
                }`}
                onClick={saveProfile}
                disabled={!isDirty || saving}
              >
                {saving ? (
                  <><span className="loading loading-spinner loading-xs" /> Saving…</>
                ) : isDirty ? (
                  'Save Changes'
                ) : (
                  'No changes'
                )}
              </button>
            </div>
          </motion.div>

          {/* ── Danger Zone ─────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card bg-red-950/20 border border-red-500/25 rounded-2xl"
          >
            <div className="card-body p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400/80 shrink-0" />
                <h2 className="text-base font-black text-red-400/80">Danger Zone</h2>
              </div>
              <p className="text-white/30 text-xs leading-relaxed">
                These actions permanently delete your data and cannot be undone. You will be asked to confirm twice before anything is deleted.
              </p>
              <div className="space-y-3">
                {/* Delete Salat logs */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-brand-surface border border-brand-border">
                  <div className="min-w-0">
                    <p className="text-white/70 text-sm font-semibold leading-tight">Delete Salat History</p>
                    <p className="text-white/30 text-xs mt-0.5 leading-snug">All prayer logs will be removed. Tracking restarts from today.</p>
                  </div>
                  <button
                    onClick={() => void deleteSalatLogs()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/60 transition-all shrink-0"
                  >
                    <TrashIcon className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>

                {/* Delete Zikr data */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-brand-surface border border-brand-border">
                  <div className="min-w-0">
                    <p className="text-white/70 text-sm font-semibold leading-tight">Delete Zikr Data</p>
                    <p className="text-white/30 text-xs mt-0.5 leading-snug">All counts, streaks, and history deleted. Your daily goal is kept.</p>
                  </div>
                  <button
                    onClick={() => void deleteZikrData()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/60 transition-all shrink-0"
                  >
                    <TrashIcon className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>

                {/* Fasting & Quran — coming soon */}
                <p className="text-white/15 text-[10px] text-center">Fasting and Quran data controls coming soon</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </AnimatedBackground>

    {/* ── Photo upload preview modal ── */}
    {/* ── Avatar selection modal ── */}
    <AnimatePresence>
      {avatarModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 22 }}
            className="bg-brand-surface rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-brand-border space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Choose Avatar</h3>
                <p className="text-white/35 text-xs mt-0.5">Nature-themed icons — no upload required</p>
              </div>
              <button onClick={() => setAvatarModalOpen(false)} className="text-white/40 hover:text-white transition-colors p-1">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_AVATARS.map((av) => (
                <button
                  key={av.id}
                  onClick={() => void selectAvatar(av)}
                  disabled={uploading}
                  className="flex flex-col items-center gap-1 group disabled:opacity-50"
                  title={av.label}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all group-hover:scale-110 group-hover:ring-2 ring-brand-emerald/60 ring-offset-2 ring-offset-brand-surface shadow-md"
                    style={{ backgroundColor: av.bg }}
                  >
                    {av.emoji}
                  </div>
                  <span className="text-white/30 text-[9px] leading-none group-hover:text-white/60 transition-colors">{av.label}</span>
                </button>
              ))}
            </div>
            {uploading && (
              <div className="flex items-center justify-center gap-2 text-brand-emerald text-sm">
                <span className="loading loading-spinner loading-sm" /> Saving…
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {photoModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 22 }}
            className="bg-brand-surface rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-brand-border text-center space-y-4"
          >
            <h3 className="text-lg font-black text-white">Upload Profile Photo</h3>

            {/* Preview */}
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-brand-emerald/40">
                <img src={photoPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Size note */}
            <p className="text-white/35 text-xs leading-relaxed px-2">
              📦 Image compressed to ~400px JPEG for free-tier storage.
              For the best experience, <span className="text-brand-emerald/70">sign in with Google</span> — your Google profile photo is used automatically.
            </p>

            <div className="flex gap-3">
              <button
                onClick={cancelPhotoModal}
                disabled={uploading}
                className="btn flex-1 btn-ghost text-white/60 border-brand-border disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={uploadPhoto}
                disabled={uploading}
                className="btn flex-1 bg-brand-emerald hover:bg-brand-emerald-dim text-white border-0 font-bold"
              >
                {uploading ? <span className="loading loading-spinner loading-sm" /> : 'Upload'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
