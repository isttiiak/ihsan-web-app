import React from "react";

export default function Footer() {
  return (
    <footer className="footer footer-center p-4 text-base-content/60">
      <aside>
        <p>
          © {new Date().getFullYear()} Ihsan — Non-commercial, privacy-first
        </p>
      </aside>
    </footer>
  );
}
