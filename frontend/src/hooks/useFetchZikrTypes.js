import { useEffect, useState } from "react";

export default function useFetchZikrTypes() {
  const [types, setTypes] = useState([]);
  useEffect(() => {
    const idToken = localStorage.getItem("ihsan_idToken");
    if (!idToken) return;
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/zikr/types`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
      .then((r) => r.json())
      .then((d) => setTypes(d.types || []))
      .catch(() => {});
  }, []);
  return types;
}
