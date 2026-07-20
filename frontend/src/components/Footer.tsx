import React from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon } from '@heroicons/react/24/solid';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-[#0a1a0d] via-brand-deep to-brand-surface text-white border-t border-brand-emerald/20 mt-auto">
      <div className="footer footer-center p-6 sm:p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <span>Made with</span>
            <HeartIcon className="w-4 h-4 text-red-300 animate-pulse" />
            <span>for the Ummah</span>
          </div>
          <nav className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1.5 text-xs">
            <Link to="/feedback" className="text-white/60 hover:text-brand-emerald underline underline-offset-2 transition-colors">
              💬 Share feedback
            </Link>
            <span className="text-white/20">•</span>
            <Link to="/contact" className="text-white/60 hover:text-cyan-300 underline underline-offset-2 transition-colors">
              📨 Contact us
            </Link>
            <span className="text-white/20">•</span>
            <Link to="/about" className="text-white/60 hover:text-brand-gold underline underline-offset-2 transition-colors">
              About
            </Link>
            <span className="text-white/20">•</span>
            <Link to="/privacy" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">
              Privacy
            </Link>
          </nav>
          <p className="text-xs sm:text-sm text-white/70">
            © {new Date().getFullYear()} Ihsan — Privacy-first, open-source spiritual companion
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
