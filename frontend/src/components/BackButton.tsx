import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export default function BackButton({ to, label = 'Back', className = '' }: BackButtonProps) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className={`btn btn-ghost btn-sm gap-1.5 text-white/70 hover:text-white hover:bg-white/10 ${className}`}
    >
      <ArrowLeftIcon className="w-4 h-4" />
      {label}
    </button>
  );
}
