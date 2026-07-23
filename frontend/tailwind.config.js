/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  // Preflight is disabled on purpose: this app already ships its own global
  // reset + design system in src/styles.scss (used by every other page).
  // Turning preflight on would silently restyle headings/buttons/forms
  // across pages we are NOT touching right now. Utilities (flex, gap-*,
  // rounded-*, shadow-*, animate-*, etc.) still work fine without it.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
        },
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'pop-in': 'pop-in 0.25s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
}
