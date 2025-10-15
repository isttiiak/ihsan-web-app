import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useZikrStore } from "../store/useZikrStore";
import useFetchZikrTypes from "../hooks/useFetchZikrTypes";
import {
  PlusIcon,
  MinusIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export default function ZikrCounter() {
  const navigate = useNavigate();
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
  const [colorShadow, setColorShadow] = useState("rgba(27, 153, 139, 0.8)");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customZikr, setCustomZikr] = useState("");

  useEffect(() => {
    if (fetchedTypes.length) {
      setTypes([...new Set([...fetchedTypes.map((t) => t.name), ...types])]);
    }
    // eslint-disable-next-line
  }, [fetchedTypes.length]);

  // Keyboard support for increment (spacebar)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (
        e.code === "Space" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)
      ) {
        e.preventDefault();
        onIncrement();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentCount]);

  // Random color shadow animation
  const randomColors = [
    "rgba(27, 153, 139, 0.9)", // Teal
    "rgba(15, 76, 117, 0.9)", // Ocean Blue
    "rgba(212, 175, 55, 0.9)", // Gold
    "rgba(59, 130, 246, 0.9)", // Blue
    "rgba(139, 92, 246, 0.9)", // Purple
    "rgba(236, 72, 153, 0.9)", // Pink
  ];

  const onIncrement = () => {
    increment();
    scheduleFlush();

    // Random color change on each count
    const randomColor =
      randomColors[Math.floor(Math.random() * randomColors.length)];
    setColorShadow(randomColor);
  };

  const onDecrement = () => {
    if (currentCount > 0) {
      decrement();
    }
  };

  const onReset = () => {
    if (currentCount > 0 && confirm("Reset count for " + selected + "?")) {
      reset();
    }
  };

  const submitCustomZikr = async () => {
    const name = customZikr.trim();
    if (!name) return;

    try {
      const idToken = localStorage.getItem("ihsan_idToken");
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/zikr/type`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ name }),
        }
      );
      if (res.ok) {
        setTypes([...types, name]);
        selectType(name);
        setCustomZikr("");
        setShowAddCustom(false);
      }
    } catch (e) {
      console.error("Failed to add custom zikr:", e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ihsan-secondary via-ihsan-primary to-ihsan-primary">
      {/* Minimal Navbar */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="btn btn-ghost btn-sm text-white gap-2 hover:bg-white/10 transition-all duration-300"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </button>
          <div className="text-white font-semibold">🕌 Ihsan</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-6xl sm:text-7xl mb-4">📿</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
            Zikr Counter
          </h1>
          <p className="text-lg sm:text-xl text-white/80">
            Remember Allah with every count
          </p>
        </motion.div>

        {/* Zikr Type Selector */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-8 border border-white/20 shadow-2xl"
        >
          <label className="block text-white/80 text-sm mb-3 text-center">
            Select Zikr Type
          </label>
          <div className="flex gap-3">
            <select
              value={selected}
              onChange={(e) => selectType(e.target.value)}
              className="select select-lg flex-1 bg-white/20 border-white/30 text-white focus:border-white/50 focus:bg-white/30 transition-all"
            >
              {types.map((t) => (
                <option
                  key={t}
                  value={t}
                  className="bg-ihsan-primary text-white"
                >
                  {t}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowAddCustom(true)}
              className="btn btn-lg bg-white/20 hover:bg-white/30 border-white/30 text-white"
              title="Add Custom Zikr"
            >
              <PlusIcon className="w-6 h-6" />
            </button>
          </div>
        </motion.div>

        {/* Counter Display */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-md rounded-3xl p-8 sm:p-12 mb-8 border border-white/20 shadow-2xl"
        >
          <div className="text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selected}:${currentCount}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  duration: 0.15,
                }}
                className="relative inline-block"
              >
                <div
                  className="text-7xl sm:text-8xl lg:text-9xl font-bold text-white"
                  style={{
                    textShadow: `0 0 40px ${colorShadow}, 0 0 80px ${colorShadow}, 0 0 120px ${colorShadow}`,
                    transition: "text-shadow 0.3s ease-in-out",
                  }}
                >
                  {currentCount}
                </div>
              </motion.div>
            </AnimatePresence>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-white/70 text-lg"
            >
              {selected}
            </motion.p>
          </div>
        </motion.div>

        {/* Counter Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-4 justify-center items-center mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDecrement}
            disabled={currentCount === 0}
            className="btn btn-lg btn-circle bg-white/20 hover:bg-white/30 border-white/30 hover:border-white/50 text-white backdrop-blur-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <MinusIcon className="w-7 h-7" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onIncrement}
            className="btn btn-lg sm:btn-wide bg-white hover:bg-white/90 text-ihsan-primary border-0 shadow-2xl hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] transition-all duration-300 font-bold text-xl"
          >
            <PlusIcon className="w-7 h-7" />
            <span className="hidden sm:inline">Count</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReset}
            disabled={currentCount === 0}
            className="btn btn-lg btn-circle bg-white/20 hover:bg-red-500/80 border-white/30 hover:border-red-500/50 text-white backdrop-blur-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className="w-7 h-7" />
          </motion.button>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center space-y-3"
        >
          <p className="text-white/60 text-sm">
            ✨ Press{" "}
            <kbd className="kbd kbd-sm bg-white/20 text-white border-white/30">
              Space
            </kbd>{" "}
            or click to count
          </p>
          <p className="text-white/60 text-sm">
            🎨 Watch the colors change with each count
          </p>
        </motion.div>
      </div>

      {/* Add Custom Zikr Modal */}
      {showAddCustom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-2xl font-bold text-ihsan-primary mb-4">
              Add Custom Zikr
            </h3>
            <input
              type="text"
              value={customZikr}
              onChange={(e) => setCustomZikr(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitCustomZikr();
                if (e.key === "Escape") setShowAddCustom(false);
              }}
              placeholder="Enter zikr name..."
              className="input input-bordered input-lg w-full mb-6 focus:border-ihsan-primary"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddCustom(false);
                  setCustomZikr("");
                }}
                className="btn btn-lg flex-1 btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={submitCustomZikr}
                disabled={!customZikr.trim()}
                className="btn btn-lg flex-1 bg-gradient-to-r from-ihsan-secondary to-ihsan-primary text-white border-0"
              >
                Add
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
