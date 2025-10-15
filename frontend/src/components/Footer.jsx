import React from "react";
import { HeartIcon } from "@heroicons/react/24/solid";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-ihsan-primary to-ihsan-secondary text-white mt-auto">
      <div className="footer footer-center p-6 sm:p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <span>Made with</span>
            <HeartIcon className="w-4 h-4 text-red-300 animate-pulse" />
            <span>for the Ummah</span>
          </div>
          <p className="text-xs sm:text-sm text-white/70">
            © {new Date().getFullYear()} Ihsan — Privacy-first, open-source
            spiritual companion
          </p>
          <div className="flex gap-4 text-xs opacity-70">
            <span>Non-commercial</span>
            <span>•</span>
            <span>Ad-free</span>
            <span>•</span>
            <span>Secure</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
