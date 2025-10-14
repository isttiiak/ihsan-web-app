import React from "react";
import { Link, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import logo from "../assets/logo.svg";

export default function Navbar() {
  const location = useLocation();

  return (
    <div className="navbar bg-base-100 border-b border-base-200">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl gap-2">
          <img src={logo} alt="Ihsan" className="w-6 h-6" />
          <span className="text-ihsan-primary">Ihsan</span>
        </Link>
      </div>
      <div className="flex-none gap-2">
        <ul className="menu menu-horizontal px-1">
          <li>
            <Link className={location.pathname === "/" ? "active" : ""} to="/">
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              className={location.pathname === "/analytics" ? "active" : ""}
              to="/analytics"
            >
              Analytics
            </Link>
          </li>
        </ul>
        <details className="dropdown dropdown-end">
          <summary className="btn btn-ghost">Menu</summary>
          <ul className="menu dropdown-content bg-base-200 rounded-box z-[1] w-52 p-2 shadow">
            <li>
              <Link to="/settings">Settings</Link>
            </li>
            <li>
              <button onClick={() => signOut(auth)}>Logout</button>
            </li>
          </ul>
        </details>
      </div>
    </div>
  );
}
