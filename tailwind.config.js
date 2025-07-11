/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'penalty-red': '#ef4444',
        'penalty-pink': '#ec4899',
        'penalty-purple': '#8b5cf6',
        'penalty-blue': '#3b82f6',
      },
      fontFamily: {
        'game': ['Comic Sans MS', 'cursive'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      }
    },
  },
  plugins: [],
}