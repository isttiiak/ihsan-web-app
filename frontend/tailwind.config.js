/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          void: '#080c12',
          deep: '#0d1520',
          surface: '#141e2e',
          border: '#1e2d42',
          emerald: '#10b981',
          'emerald-dim': '#059669',
          gold: '#f59e0b',
          'gold-dim': '#d97706',
          magenta: '#c026d3',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'conic-brand': 'conic-gradient(from 0deg, #10b981, #f59e0b, #c026d3, #10b981)',
      },
      boxShadow: {
        glass: '0 20px 60px -20px rgba(0,0,0,0.6)',
        islamic: '0 10px 40px rgba(16,185,129,0.2)',
        'glow-emerald': '0 0 24px rgba(16,185,129,0.45)',
        'glow-gold': '0 0 24px rgba(245,158,11,0.45)',
        'glow-magenta': '0 0 24px rgba(192,38,211,0.45)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        navbarShimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        ihsan: {
          primary: '#10b981',
          secondary: '#059669',
          accent: '#f59e0b',
          neutral: '#141e2e',
          'base-100': '#080c12',
          'base-200': '#0d1520',
          'base-300': '#141e2e',
          'base-content': '#f1f5f9',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#06b6d4',
        },
      },
      'light',
    ],
    darkTheme: 'ihsan',
  },
};
