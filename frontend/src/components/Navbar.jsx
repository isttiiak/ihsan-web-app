import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import logo from "../assets/logo.svg";
import { useAuthStore } from "../store/useAuthStore";
import { useZikrStore } from "../store/useZikrStore";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { reset } = useZikrStore();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const dropdownRef = useRef(null);

  const salam = `Assalamu ‘alaikum wa raḥmatullāhi wa barakātuh${
    user?.displayName ? ", " + user.displayName : ""
  }`;

  useEffect(() => {
    // Close dropdown when route changes
    if (dropdownRef.current && dropdownRef.current.hasAttribute("open")) {
      dropdownRef.current.removeAttribute("open");
    }
  }, [location.pathname]);

  const closeDropdown = () => {
    if (dropdownRef.current) dropdownRef.current.removeAttribute("open");
  };

  return (
    <>
      <div className="navbar bg-base-100 border-b border-base-200">
        <div className="navbar-start">
          <Link to="/" className="btn btn-ghost text-xl gap-2">
            <img src={logo} alt="Ihsan" className="w-6 h-6" />
            <span className="text-ihsan-primary">Ihsan</span>
          </Link>
        </div>

        <div className="navbar-center">
          <div className="text-center text-sm md:text-base opacity-80 truncate max-w-[60vw]">
            {salam}
          </div>
        </div>

        <div className="navbar-end gap-2">
          <ul className="menu menu-horizontal px-1">
            <li>
              <Link
                className={location.pathname === "/analytics" ? "active" : ""}
                to="/analytics"
              >
                Analytics
              </Link>
            </li>
          </ul>
          <details className="dropdown dropdown-end" ref={dropdownRef}>
            <summary className="btn btn-ghost btn-circle avatar placeholder">
              {user?.photoUrl ? (
                <div className="w-8 rounded-full overflow-hidden">
                  <img
                    alt={user.displayName || "Profile"}
                    src={user.photoUrl}
                  />
                </div>
              ) : (
                <div className="bg-base-200 text-base-content rounded-full w-8">
                  <span className="text-xs">
                    {user?.displayName?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
              )}
            </summary>
            <ul className="menu dropdown-content bg-base-200 rounded-box z-[1] w-64 p-2 shadow">
              {user ? (
                <>
                  <li className="menu-title">Profile</li>
                  <li>
                    <Link to="/settings" onClick={closeDropdown}>
                      Edit profile
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        const theme =
                          document.documentElement.getAttribute("data-theme") ||
                          "emerald";
                        const next =
                          theme === "dark"
                            ? "light"
                            : theme === "light"
                            ? "emerald"
                            : "dark";
                        localStorage.setItem("ihsan_theme", next);
                        document.documentElement.setAttribute(
                          "data-theme",
                          next
                        );
                        closeDropdown();
                      }}
                    >
                      Toggle theme
                    </button>
                  </li>
                  <li>
                    <Link to="/settings" onClick={closeDropdown}>
                      Settings
                    </Link>
                  </li>
                  <li>
                    <button
                      className="btn btn-error btn-sm"
                      onClick={() => {
                        closeDropdown();
                        setConfirmLogout(true);
                      }}
                    >
                      Sign out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link
                      to="/login"
                      onClick={() => {
                        sessionStorage.setItem(
                          "ihsan_redirect",
                          location.pathname
                        );
                        closeDropdown();
                      }}
                    >
                      Sign in
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        const theme =
                          document.documentElement.getAttribute("data-theme") ||
                          "emerald";
                        const next =
                          theme === "dark"
                            ? "light"
                            : theme === "light"
                            ? "emerald"
                            : "dark";
                        localStorage.setItem("ihsan_theme", next);
                        document.documentElement.setAttribute(
                          "data-theme",
                          next
                        );
                        closeDropdown();
                      }}
                    >
                      Toggle theme
                    </button>
                  </li>
                </>
              )}
            </ul>
          </details>
        </div>
      </div>

      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card bg-base-200 shadow-xl w-full max-w-md">
            <div className="card-body gap-4">
              <h3 className="card-title">Sign out?</h3>
              <p>
                Are you sure you want to sign out? Unsaved counts will be lost.
              </p>
              <div className="card-actions justify-end">
                <button className="btn" onClick={() => setConfirmLogout(false)}>
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
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
