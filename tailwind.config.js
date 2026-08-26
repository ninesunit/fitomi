/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // The System's palette: deep void backgrounds, cyan interface glow,
        // violet for shadow/monarch surfaces, crimson for raid bosses.
        void: {
          950: '#04060d',
          900: '#070b16',
          850: '#0a0f1e',
          800: '#0e1526',
          700: '#151d33',
          600: '#1e2942',
          500: '#2b3855',
        },
        system: {
          50: '#eaf9ff',
          100: '#cbf0ff',
          200: '#9ae3ff',
          300: '#5fd3ff',
          400: '#26bdff',
          500: '#06a3ec',
          600: '#0081c4',
          700: '#03669e',
          800: '#0a5580',
          900: '#0e476a',
        },
        shadow: {
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          900: '#4c1d95',
        },
        blood: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        mana: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        gold: {
          300: '#fde68a',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        display: ['Rajdhani', 'Oswald', 'Impact', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        system: '0 0 0 1px rgba(38,189,255,0.35), 0 0 22px -4px rgba(38,189,255,0.45)',
        'system-lg': '0 0 0 1px rgba(38,189,255,0.5), 0 0 48px -8px rgba(38,189,255,0.6)',
        monarch: '0 0 0 1px rgba(167,139,250,0.4), 0 0 32px -6px rgba(139,92,246,0.55)',
        boss: '0 0 0 1px rgba(239,68,68,0.4), 0 0 34px -6px rgba(239,68,68,0.5)',
        inner_glow: 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(rgba(38,189,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(38,189,255,0.07) 1px, transparent 1px)',
      },
      backgroundSize: { grid: '38px 38px' },
      keyframes: {
        'system-in': {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(700%)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        spinSlow: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        'system-in': 'system-in 260ms cubic-bezier(0.22,1,0.36,1)',
        scanline: 'scanline 4.5s linear infinite',
        'pulse-glow': 'pulseGlow 2.4s ease-in-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
        float: 'float 3.5s ease-in-out infinite',
        'spin-slow': 'spinSlow 14s linear infinite',
      },
    },
  },
  plugins: [],
};
