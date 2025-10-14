import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useZikrStore } from "../store/useZikrStore";
import useFetchZikrTypes from "../hooks/useFetchZikrTypes";
import CounterButton from "../components/CounterButton";

export default function Dashboard() {
  const {
    types,
    selected,
    count,
    selectType,
    increment,
    decrement,
    reset,
    startAutoSaveTimer,
    isSaving,
    setTypes,
  } = useZikrStore();
  const fetchedTypes = useFetchZikrTypes();

  useEffect(() => {
    if (fetchedTypes.length) {
      setTypes([...new Set([...fetchedTypes.map((t) => t.name), ...types])]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedTypes.length]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("ihsan_user") || "{}");
    const handler = (e) => {
      if (!user?.uid && count > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [count]);

  const onIncrement = () => {
    increment();
    startAutoSaveTimer();
  };

  const onDecrement = () => {
    decrement();
  };

  const addCustom = async () => {
    const name = prompt("Add new Zikr type");
    if (!name) return;
    try {
      const idToken = localStorage.getItem("ihsan_idToken");
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/zikr/type`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: idToken ? `Bearer ${idToken}` : "",
        },
        body: JSON.stringify({ name }),
      });
      setTypes([...new Set([name, ...types])]);
      selectType(name);
    } catch (e) {
      console.error(e);
    }
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
            <button className="btn" onClick={addCustom}>
              Add Custom
            </button>
          </div>

          <div className="text-center">
            <div className="text-2xl mb-2">{selected}</div>
            <motion.div
              key={count}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="text-7xl md:text-8xl font-bold text-ihsan-primary"
            >
              {count}
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
            <div className="mt-4 text-sm opacity-70">
              {isSaving
                ? "Saving..."
                : "Counts will auto-save when you pause (if logged in)"}
            </div>
            <div className="mt-6">
              <button className="btn btn-sm btn-outline" onClick={reset}>
                Reset counter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
