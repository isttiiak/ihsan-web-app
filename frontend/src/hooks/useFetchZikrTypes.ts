import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';

interface ZikrType {
  name: string;
  [key: string]: unknown;
}

export default function useFetchZikrTypes(): ZikrType[] {
  const [types, setTypes] = useState<ZikrType[]>([]);
  const { authLoading } = useAuthStore();
  useEffect(() => {
    if (authLoading) return;
    const idToken = localStorage.getItem('ihsan_idToken');
    if (!idToken) return;
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/zikr/types`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
      .then((r) => r.json())
      .then((d: { types?: ZikrType[] }) => setTypes(d.types || []))
      .catch(() => {});
  }, [authLoading]);
  return types;
}
