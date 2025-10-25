/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        celo: {
          green: '#35D07F',
          gold: '#FBCC5C',
          dark: '#2E3338',
        },
      },
    },
  },
  plugins: [],
}
