import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useZikrStore } from "../store/useZikrStore";
import useFetchZikrTypes from "../hooks/useFetchZikrTypes";

export default function Dashboard() {
  const {
    types,
    selected,
    counts,
    selectType,
    increment,
    decrement,
    reset,
    scheduleFlush,
    setTypes,
  } = useZikrStore();
  const fetchedTypes = useFetchZikrTypes();
  const currentCount = counts?.[selected] || 0;
  const [showAdd, setShowAdd] = useState(false);
  const [newZikr, setNewZikr] = useState("");

  useEffect(() => {
    if (fetchedTypes.length) {
      setTypes([...new Set([...fetchedTypes.map((t) => t.name), ...types])]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedTypes.length]);

  // Warn about unsaved only if anonymous user (no persistence anyway now we reset on reload)
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("ihsan_user") || "{}");
    const handler = (e) => {
      if (!user?.uid && currentCount > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [currentCount]);

  const onIncrement = () => {
    increment();
    scheduleFlush();
  };

  const onDecrement = () => {
    decrement();
  };

  const submitCustom = async () => {
    const name = newZikr.trim();
    if (!name) return;
    try {
      const idToken = localStorage.getItem("ihsan_idToken");
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/zikr/type`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken ? `Bearer ${idToken}` : "",
          },
          body: JSON.stringify({ name }),
        }
      );
      if (!res.ok) throw new Error("Failed");
    } catch (e) {
      console.warn("Adding custom locally", e?.message || e);
    }
    setTypes([...new Set([name, ...types])]);
    selectType(name);
    setNewZikr("");
    setShowAdd(false);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <select
              value={selected}
              onChange={(e) => selectType(e.target.value)}
              className="select select-bordered max-w-xs"
            >
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <button className="btn" onClick={() => setShowAdd(true)}>
              Add Custom
            </button>
          </div>

          <div className="text-center">
            <div className="text-2xl mb-2">{selected}</div>
            <motion.div
              key={`${selected}:${currentCount}`}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="text-7xl md:text-8xl font-bold text-ihsan-primary"
            >
              {currentCount}
            </motion.div>
            <div className="mt-4 flex justify-center gap-4">
              <button className="btn btn-outline" onClick={onDecrement}>
                −1
              </button>
              <button
                className="btn btn-primary btn-lg"
                style={{ minWidth: 160 }}
                onClick={onIncrement}
              >
                +1
              </button>
            </div>
            <div className="mt-6">
              <button className="btn btn-sm btn-outline" onClick={reset}>
                Reset counter
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="toast toast-center z-50">
          <div className="alert bg-gradient-to-r from-emerald-500 to-amber-500 text-white shadow-xl">
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="font-semibold">Add new Zikr</div>
              <input
                autoFocus
                value={newZikr}
                onChange={(e) => setNewZikr(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitCustom();
                  if (e.key === "Escape") setShowAdd(false);
                }}
                placeholder="Type name..."
                className="input input-bordered text-base-content"
              />
              <div className="flex gap-2 justify-end">
                <button className="btn" onClick={() => setShowAdd(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={submitCustom}>
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
