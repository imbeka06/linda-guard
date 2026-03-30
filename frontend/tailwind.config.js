/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        safaricom: {
          green: '#00A859',
          dark: '#007A3E',
        }
      }
    },
  },
  plugins: [],
}