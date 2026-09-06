/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon': {
          blue: '#00d4ff',
          purple: '#a855f7',
          green: '#22c55e',
          yellow: '#eab308',
          red: '#ef4444',
        },
      },
      backgroundColor: {
        'dark': '#07090d',
        'dark-card': '#0a0d14',
        'dark-input': '#0d1117',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0,212,255,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0,212,255,0.6)' },
        },
      },
    },
  },
  plugins: [],
};
