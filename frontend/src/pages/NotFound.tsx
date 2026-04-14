import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import AnimatedBackground from '../components/AnimatedBackground.js';

export default function NotFound() {
  return (
    <AnimatedBackground variant="default">
      <div className="flex items-center justify-center p-4 min-h-screen">
        <div className="card bg-brand-surface border border-brand-border shadow-glass max-w-md w-full">
          <div className="card-body text-center p-8 sm:p-12">
            <div className="flex justify-center mb-4">
              <MagnifyingGlassIcon className="w-20 h-20 sm:w-24 sm:h-24 text-brand-emerald/40" />
            </div>
            <h1 className="text-6xl sm:text-7xl font-bold text-brand-emerald mb-4">404</h1>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Page Not Found</h2>
            <p className="text-sm sm:text-base text-white/60 mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <Link
              to="/"
              className="btn btn-lg bg-brand-emerald hover:bg-brand-emerald-dim text-white border-0 hover:shadow-lg transition-all gap-2"
            >
              <HomeIcon className="w-5 h-5" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
