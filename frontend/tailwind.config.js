/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        foursquare: {
          pink: '#FA4778',
          navy: '#0C2340',
          blue: '#2D5BE3',
          cream: '#FFF9F5',
        }
      }
    },
  },
  plugins: [],
}
