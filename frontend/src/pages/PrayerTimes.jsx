import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "../components/AnimatedBackground";

export default function PrayerTimes() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Default prayer times (will be replaced with API data)
  const [prayerTimes, setPrayerTimes] = useState(() => {
    const saved = localStorage.getItem("ihsan_prayer_times");
    return saved
      ? JSON.parse(saved)
      : {
          fajr: "05:30",
          sunrise: "06:45",
          dhuhr: "12:30",
          asr: "15:45",
          maghrib: "18:15",
          isha: "19:30",
        };
  });

  const prayers = [
    { id: "fajr", name: "Fajr", icon: "🌅", description: "Dawn Prayer" },
    { id: "sunrise", name: "Sunrise", icon: "🌄", description: "Shurooq" },
    { id: "dhuhr", name: "Dhuhr", icon: "☀️", description: "Noon Prayer" },
    { id: "asr", name: "Asr", icon: "🌤️", description: "Afternoon Prayer" },
    {
      id: "maghrib",
      name: "Maghrib",
      icon: "🌆",
      description: "Sunset Prayer",
    },
    { id: "isha", name: "Isha", icon: "🌙", description: "Night Prayer" },
  ];

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get next prayer
  const getNextPrayer = () => {
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();

    for (let prayer of prayers) {
      if (prayer.id === "sunrise") continue; // Skip sunrise
      const [hours, minutes] = prayerTimes[prayer.id].split(":").map(Number);
      const prayerMinutes = hours * 60 + minutes;

      if (prayerMinutes > now) {
        return prayer;
      }
    }

    // If no prayer found, next is Fajr tomorrow
    return prayers[0];
  };

  const nextPrayer = getNextPrayer();

  // Calculate time until next prayer
  const getTimeUntilNext = () => {
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    const [hours, minutes] = prayerTimes[nextPrayer.id].split(":").map(Number);
    let prayerMinutes = hours * 60 + minutes;

    if (prayerMinutes < now) {
      prayerMinutes += 24 * 60; // Add 24 hours if it's tomorrow
    }

    const diff = prayerMinutes - now;
    const hoursLeft = Math.floor(diff / 60);
    const minutesLeft = diff % 60;

    return { hours: hoursLeft, minutes: minutesLeft };
  };

  const timeUntilNext = getTimeUntilNext();

  // Check if current time is prayer time
  const isCurrentPrayer = (prayerId) => {
    const [hours, minutes] = prayerTimes[prayerId].split(":").map(Number);
    return (
      currentTime.getHours() === hours && currentTime.getMinutes() === minutes
    );
  };

  // Request location
  const requestLocation = () => {
    setLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(loc);
          localStorage.setItem("ihsan_location", JSON.stringify(loc));
          setLoading(false);
          // TODO: Fetch actual prayer times from API
          alert("Location saved! Prayer times API integration coming soon.");
        },
        (error) => {
          console.error("Location error:", error);
          alert(
            "Could not get your location. Please enable location services."
          );
          setLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  };

  // Load saved location
  useEffect(() => {
    const savedLocation = localStorage.getItem("ihsan_location");
    if (savedLocation) {
      setLocation(JSON.parse(savedLocation));
    }
  }, []);

  return (
    <AnimatedBackground variant="sunset">
      {/* Minimal Navbar */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="btn btn-ghost btn-sm text-white gap-2 hover:bg-white/10"
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
          <div className="text-6xl sm:text-7xl mb-4">⏰</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
            Prayer Times
          </h1>
          <p className="text-lg sm:text-xl text-white/80">
            Never miss a prayer
          </p>
        </motion.div>

        {/* Current Time & Next Prayer */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 mb-8 border border-white/20 shadow-2xl"
        >
          <div className="text-center mb-6">
            <div className="text-5xl sm:text-6xl font-bold text-white mb-2">
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })}
            </div>
            <div className="text-white/70 text-sm">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          <div className="divider divider-neutral opacity-30"></div>

          <div className="text-center">
            <div className="text-white/70 text-sm mb-2">Next Prayer</div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-4xl">{nextPrayer.icon}</span>
              <span className="text-3xl font-bold text-white">
                {nextPrayer.name}
              </span>
            </div>
            <div className="text-2xl font-semibold text-white/90 mb-2">
              {prayerTimes[nextPrayer.id]}
            </div>
            <div className="text-white/70">
              in {timeUntilNext.hours}h {timeUntilNext.minutes}m
            </div>
          </div>
        </motion.div>

        {/* Prayer Times List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-3 mb-8"
        >
          {prayers.map((prayer, index) => (
            <motion.div
              key={prayer.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02, x: 5 }}
              transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
              className={`bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border cursor-pointer ${
                nextPrayer.id === prayer.id
                  ? "border-white/50 bg-white/20 shadow-xl"
                  : "border-white/20"
              } ${
                isCurrentPrayer(prayer.id)
                  ? "ring-4 ring-white/30 animate-pulse"
                  : ""
              } hover:bg-white/20 hover:shadow-2xl transition-all duration-500`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl sm:text-4xl">{prayer.icon}</div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold text-white">
                      {prayer.name}
                    </div>
                    <div className="text-sm text-white/70">
                      {prayer.description}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-bold text-white">
                    {prayerTimes[prayer.id]}
                  </div>
                  {nextPrayer.id === prayer.id && prayer.id !== "sunrise" && (
                    <div className="text-xs text-white/70 mt-1">Next</div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Location Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                📍 Location Settings
              </h3>
              <p className="text-sm text-white/70">
                {location
                  ? `Location: ${location.latitude.toFixed(
                      2
                    )}, ${location.longitude.toFixed(2)}`
                  : "Set your location for accurate prayer times"}
              </p>
            </div>
            <button
              onClick={requestLocation}
              disabled={loading}
              className="btn btn-sm bg-white/20 border-white/30 hover:bg-white/30 text-white"
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : location ? (
                "Update"
              ) : (
                "Enable"
              )}
            </button>
          </div>

          <div className="mt-4 p-4 bg-white/5 rounded-xl">
            <p className="text-xs text-white/60">
              💡 <strong>Coming Soon:</strong> Automatic prayer time calculation
              based on your location using the Aladhan API. Currently showing
              default times for demo purposes.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatedBackground>
  );
}
