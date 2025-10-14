import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useZikrStore } from "../store/useZikrStore";
import { useAuthStore } from "../store/useAuthStore";

export default function UnsavedWarning() {
  const { count } = useZikrStore();
  const { user } = useAuthStore();
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const dismissed = sessionStorage.getItem("ihsan_unsaved_dismissed") === "1";
    const onAuthPage = ["/login", "/signup"].includes(location.pathname);
    if (!user && count > 0 && !dismissed && !onAuthPage) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [user, count, location.pathname]);

  useEffect(() => {
    if (count === 0) sessionStorage.removeItem("ihsan_unsaved_dismissed");
  }, [count]);

  if (!visible) return null;

  return (
    <div className="toast toast-center z-50">
      <div className="alert alert-warning items-start">
        <div className="flex-1">
          <h3 className="font-bold">Unsaved counts</h3>
          <div className="text-sm">
            You’re not signed in. Your tasbeeh count will be lost on reload. Log
            in to save your progress.
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            className="btn btn-sm"
            onClick={() => {
              sessionStorage.setItem("ihsan_redirect", location.pathname);
              navigate("/signup");
            }}
          >
            Sign up
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              sessionStorage.setItem("ihsan_redirect", location.pathname);
              navigate("/login");
            }}
          >
            Log in
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => {
              sessionStorage.setItem("ihsan_unsaved_dismissed", "1");
              setVisible(false);
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
