import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useZikrStore } from "../store/useZikrStore";
import useFetchZikrTypes from "../hooks/useFetchZikrTypes";
import {
  PlusIcon,
  MinusIcon,
  ArrowPathIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";

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

  // Keyboard support for increment (spacebar)
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only increment if spacebar is pressed and not in an input/textarea
      if (
        e.code === "Space" &&
        !["INPUT", "TEXTAREA"].includes(e.target.tagName)
      ) {
        e.preventDefault();
        onIncrement();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
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
    <div className="min-h-screen bg-gradient-to-br from-ihsan-light via-base-100 to-ihsan-light/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Zikr Type Selector Card */}
        <div className="card bg-base-100 shadow-islamic border border-ihsan-primary/10">
          <div className="card-body p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div className="form-control flex-1">
                <label className="label">
                  <span className="label-text font-semibold text-ihsan-primary">
                    Select Zikr Type
                  </span>
                </label>
                <select
                  value={selected}
                  onChange={(e) => selectType(e.target.value)}
                  className="select select-bordered w-full focus:border-ihsan-primary focus:outline-none focus:ring-2 focus:ring-ihsan-primary/20 transition-all bg-gradient-to-r from-base-100 to-base-200"
                >
                  {types.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-outline btn-secondary gap-2 sm:mt-8"
                onClick={() => setShowAdd(true)}
              >
                <PlusCircleIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Add Custom</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Counter Card */}
        <div className="card bg-gradient-to-br from-ihsan-primary to-ihsan-secondary text-white shadow-islamic-lg">
          <div className="card-body p-6 sm:p-8 lg:p-12">
            {/* Zikr Name */}
            <div className="text-center mb-6">
              <div className="inline-block bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold">
                  {selected}
                </h2>
              </div>
            </div>

            {/* Counter Display */}
            <div className="text-center mb-8">
              <motion.div
                key={`${selected}:${currentCount}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="relative inline-block"
              >
                <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full" />
                <div className="relative text-7xl sm:text-8xl lg:text-9xl font-bold text-white drop-shadow-2xl">
                  {currentCount}
                </div>
              </motion.div>
              <p className="mt-4 text-white/80 text-sm sm:text-base">Count</p>
            </div>

            {/* Counter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <button
                className="btn btn-lg btn-circle bg-white/20 hover:bg-white/30 border-white/30 hover:border-white/50 text-white backdrop-blur-sm transition-all hover:scale-110"
                onClick={onDecrement}
                disabled={currentCount === 0}
              >
                <MinusIcon className="w-6 h-6" />
              </button>

              <button
                className="btn btn-lg sm:btn-wide bg-white hover:bg-white/90 text-ihsan-primary border-0 shadow-gold hover:shadow-islamic-lg hover:scale-105 transition-all duration-300 font-bold text-lg"
                onClick={onIncrement}
              >
                <PlusIcon className="w-6 h-6" />
                <span>Increment</span>
              </button>

              <button
                className="btn btn-lg btn-circle bg-white/20 hover:bg-white/30 border-white/30 hover:border-white/50 text-white backdrop-blur-sm transition-all hover:scale-110"
                onClick={reset}
                disabled={currentCount === 0}
              >
                <ArrowPathIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Reset hint */}
            <div className="text-center mt-6">
              <p className="text-white/60 text-xs sm:text-sm">
                Tap increment or press spacebar to count
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Card (Optional) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="card bg-base-100 shadow-md border border-ihsan-primary/10">
            <div className="card-body p-4 text-center">
              <div className="text-3xl font-bold text-ihsan-primary">
                {currentCount}
              </div>
              <p className="text-xs opacity-70">Today's Count</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-md border border-ihsan-secondary/10">
            <div className="card-body p-4 text-center">
              <div className="text-3xl font-bold text-ihsan-secondary">
                {types.length}
              </div>
              <p className="text-xs opacity-70">Zikr Types</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-md border border-ihsan-accent/10 col-span-2 sm:col-span-1">
            <div className="card-body p-4 text-center">
              <div className="text-3xl font-bold text-ihsan-accent">
                {Object.values(counts).reduce((a, b) => a + b, 0)}
              </div>
              <p className="text-xs opacity-70">Total Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Zikr Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card bg-base-100 shadow-islamic-lg w-full max-w-md border border-ihsan-primary/20"
          >
            <div className="card-body gap-4">
              <h3 className="card-title text-ihsan-primary">
                Add New Zikr Type
              </h3>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Zikr Name</span>
                </label>
                <input
                  autoFocus
                  value={newZikr}
                  onChange={(e) => setNewZikr(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitCustom();
                    if (e.key === "Escape") setShowAdd(false);
                  }}
                  placeholder="e.g., SubhanAllah, Alhamdulillah"
                  className="input input-bordered focus:border-ihsan-primary focus:outline-none focus:ring-2 focus:ring-ihsan-primary/20 transition-all"
                />
              </div>
              <div className="card-actions justify-end gap-2">
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn bg-gradient-teal text-white border-0 hover:shadow-islamic transition-all"
                  onClick={submitCustom}
                  disabled={!newZikr.trim()}
                >
                  Add Zikr
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
