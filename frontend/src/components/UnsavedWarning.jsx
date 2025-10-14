import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useZikrStore } from "../store/useZikrStore";
import { useAuthStore } from "../store/useAuthStore";

export default function UnsavedWarning() {
  const { counts } = useZikrStore();
  const { user, authLoading } = useAuthStore();
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const anyUnsaved = Object.values(counts || {}).some((c) => (c || 0) > 0);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("ihsan_unsaved_dismissed") === "1";
    const onAuthPage = ["/login", "/signup"].includes(location.pathname);
    if (!authLoading && !user && anyUnsaved && !dismissed && !onAuthPage) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [user, anyUnsaved, location.pathname, authLoading]);

  useEffect(() => {
    if (!anyUnsaved) sessionStorage.removeItem("ihsan_unsaved_dismissed");
  }, [anyUnsaved]);

  if (!visible) return null;

  return (
    <div className="toast toast-center z-50">
      <div className="alert alert-warning items-start">
        <div className="flex-1">
          <h3 className="font-bold">Unsaved counts</h3>
          <div className="text-sm">
            You’re not signed in. Your tasbeeh counts will be lost on reload.
            Log in to save your progress.
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
