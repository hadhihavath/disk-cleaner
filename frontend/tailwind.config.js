/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        glass: {
          bg: 'rgba(30, 41, 59, 0.45)',
          border: 'rgba(255, 255, 255, 0.08)',
          highlight: 'rgba(255, 255, 255, 0.15)',
        },
        windows: {
          blue: '#0078d4',
          darkBlue: '#005a9e',
          lightBlue: '#2b579a',
          purple: '#6d28d9',
          darkBg: '#0f172a',
          cardBg: 'rgba(15, 23, 42, 0.65)',
        }
      },
      backdropBlur: {
        xs: '2px',
        glass: '20px',
      },
      boxShadow: {
        'glow-blue': '0 0 15px rgba(0, 120, 212, 0.45)',
        'glow-purple': '0 0 15px rgba(109, 40, 217, 0.45)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
