/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090A0F",
        surface: "#11131F",
        "surface-hover": "#1A1D2E",
        border: "#23273D",
        primary: {
          50: '#EEF2FF',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        cyber: {
          cyan: "#06B6D4",
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#F43F5E",
          purple: "#A855F7"
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
