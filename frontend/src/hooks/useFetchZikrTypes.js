import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";

export default function useFetchZikrTypes() {
  const [types, setTypes] = useState([]);
  const { authLoading } = useAuthStore();
  useEffect(() => {
    if (authLoading) return;
    const idToken = localStorage.getItem("ihsan_idToken");
    if (!idToken) return;
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/zikr/types`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
      .then((r) => r.json())
      .then((d) => setTypes(d.types || []))
      .catch(() => {});
  }, [authLoading]);
  return types;
}
