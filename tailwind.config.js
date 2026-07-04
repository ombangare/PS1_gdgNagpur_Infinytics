/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enables manual dark mode toggling
  theme: {
    extend: {
      colors: {
        // Clinical Theme Palette
        clinical: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6', // Teal
          600: '#0d9488',
          900: '#134e4a',
        }
      }
    },
  },
  plugins: [],
}