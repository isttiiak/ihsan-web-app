import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import logo from "../assets/logo.svg";
import { useAuthStore } from "../store/useAuthStore";
import { useZikrStore } from "../store/useZikrStore";
import {
  Bars3Icon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { reset } = useZikrStore();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const salam = `Assalamu 'alaikum${
    user?.displayName ? ", " + user.displayName.split(" ")[0] : ""
  }`;

  // Hide salam on focus routes
  const focusRoutes = ["/zikr", "/salat", "/fasting", "/prayer-times"];
  const hideSalam = focusRoutes.includes(location.pathname);

  useEffect(() => {
    // Close dropdown when route changes
    if (dropdownRef.current && dropdownRef.current.hasAttribute("open")) {
      dropdownRef.current.removeAttribute("open");
    }
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const closeDropdown = () => {
    if (dropdownRef.current) dropdownRef.current.removeAttribute("open");
  };

  const toggleTheme = () => {
    const theme =
      document.documentElement.getAttribute("data-theme") || "emerald";
    const next =
      theme === "dark" ? "light" : theme === "light" ? "emerald" : "dark";
    localStorage.setItem("ihsan_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  // Simple React Bits-style TextType animation
  function TextType({ text, speed = 80 }) {
    const [display, setDisplay] = useState("");
    useEffect(() => {
      let i = 0;
      setDisplay("");
      const interval = setInterval(() => {
        setDisplay((d) => text.slice(0, i));
        i++;
        if (i > text.length) clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }, [text, speed]);
    return (
      <span
        style={{
          backgroundImage:
            "linear-gradient(90deg, var(--brand-emerald,#2A9B7D) 0%, var(--brand-gold,#D6C52B) 50%, var(--brand-magenta,#C757AB) 100%)",
          backgroundSize: "200% 100%",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
          WebkitTextStroke: "0.4px rgba(0,0,0,0.2)",
          textShadow: "0 2px 12px rgba(0,0,0,0.25)",
          animation: "navbarShimmer 10s linear infinite",
        }}
      >
        {display}
      </span>
    );
  }

  return (
    <>
      <div className="navbar bg-gradient-to-r from-ihsan-primary to-ihsan-secondary text-white shadow-islamic sticky top-0 z-40 px-2 sm:px-4">
        <div className="navbar-start flex-1">
          <Link
            to="/"
            className="btn btn-ghost text-lg sm:text-xl gap-2 hover:bg-white/10"
          >
            <img src={logo} alt="Ihsan" className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="font-bold hidden sm:inline">Ihsan</span>
          </Link>
        </div>

        {/* Center - Salam (Hidden on very small screens) */}
        {user && !hideSalam && (
          <div className="navbar-center hidden md:flex flex-1 justify-center">
            <div className="text-center px-4">
              {/* React Bits TextType animation for salam */}
              <TextType text={salam} speed={60} />
            </div>
          </div>
        )}

        {/* Right Side - Desktop Menu */}
        <div className="navbar-end flex-none gap-2">
          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex gap-1">
            {user && (
              <>
                <Link
                  to="/settings"
                  className={`btn btn-ghost btn-sm gap-2 hover:bg-white/10 ${
                    location.pathname === "/settings" ? "bg:white/20" : ""
                  }`}
                >
                  <Cog6ToothIcon className="w-4 h-4" />
                  Settings
                </Link>
              </>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            className="btn btn-ghost btn-circle btn-sm hover:bg-white/10"
            onClick={toggleTheme}
          >
            <MoonIcon className="w-5 h-5 hidden dark:block" />
            <SunIcon className="w-5 h-5 dark:hidden" />
          </button>

          {/* User Menu Dropdown */}
          {user ? (
            <details className="dropdown dropdown-end" ref={dropdownRef}>
              <summary className="btn btn-ghost btn-circle avatar placeholder hover:bg-white/10">
                {user?.photoUrl ? (
                  <div className="w-8 sm:w-10 rounded-full overflow-hidden ring-2 ring-white/30">
                    <img
                      alt={user.displayName || "Profile"}
                      src={user.photoUrl}
                    />
                  </div>
                ) : (
                  <div className="bg-white/20 text-white rounded-full w-8 sm:w-10 flex items-center justify-center">
                    <span className="text-sm font-semibold">
                      {user?.displayName?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
              </summary>
              <ul className="menu dropdown-content bg-base-100 text-base-content rounded-box z-[1] w-64 p-2 shadow-islamic-lg mt-3 border border-ihsan-primary/10">
                <li className="menu-title">
                  <span className="text-ihsan-primary">Profile</span>
                </li>
                <li>
                  <Link to="/profile" onClick={closeDropdown} className="gap-2">
                    <UserCircleIcon className="w-5 h-5" />
                    Edit Profile
                  </Link>
                </li>
                <li className="lg:hidden">
                  <Link
                    to="/settings"
                    onClick={closeDropdown}
                    className="gap-2"
                  >
                    <Cog6ToothIcon className="w-5 h-5" />
                    Settings
                  </Link>
                </li>
                <div className="divider my-1"></div>
                <li>
                  <button
                    className="text-error gap-2"
                    onClick={() => {
                      closeDropdown();
                      setConfirmLogout(true);
                    }}
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    Sign Out
                  </button>
                </li>
              </ul>
            </details>
          ) : (
            <Link
              to="/login"
              className="btn btn-sm bg-white text-ihsan-primary hover:bg-white/90 border-0 shadow-md"
              onClick={() => {
                sessionStorage.setItem("ihsan_redirect", location.pathname);
              }}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Salam Banner (Shown only on small screens) */}
      {user && !hideSalam && (
        <div className="md:hidden bg-gradient-to-r from-ihsan-secondary/10 to-ihsan-primary/10 px-4 py-2 text-center border-b border-ihsan-primary/10">
          <p
            className="text-xs sm:text-sm font-extrabold truncate"
            style={{
              backgroundImage:
                "linear-gradient(90deg, var(--brand-emerald,#2A9B7D) 0%, var(--brand-gold,#D6C52B) 50%, var(--brand-magenta,#C757AB) 100%)",
              backgroundSize: "200% 100%",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              WebkitTextStroke: "0.3px rgba(0,0,0,0.25)",
              textShadow: "0 2px 10px rgba(0,0,0,0.25)",
              animation: "navbarShimmer 10s linear infinite",
            }}
          >
            {salam}
          </p>
        </div>
      )}

      {/* Add a keyframes style tag for shimmer if not present globally */}
      <style>{`@keyframes navbarShimmer {0%{background-position: 0% 50%;}50%{background-position: 100% 50%;}100%{background-position: 0% 50%;}}`}</style>

      {/* Logout Confirmation Modal */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card bg-base-100 shadow-islamic-lg w-full max-w-md border border-ihsan-primary/10">
            <div className="card-body gap-4">
              <h3 className="card-title text-ihsan-primary">Sign Out?</h3>
              <p className="text-sm opacity-70">
                Are you sure you want to sign out? Unsaved counts will be lost.
              </p>
              <div className="card-actions justify-end gap-2">
                <button
                  className="btn btn-ghost"
                  onClick={() => setConfirmLogout(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-error"
                  onClick={async () => {
                    await signOut(auth);
                    setUser(null);
                    localStorage.removeItem("ihsan_user");
                    localStorage.removeItem("ihsan_idToken");
                    sessionStorage.removeItem("ihsan_redirect");
                    reset();
                    setConfirmLogout(false);
                    navigate("/", { replace: true });
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
