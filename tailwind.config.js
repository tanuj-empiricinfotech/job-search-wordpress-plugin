/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Adjust paths based on your file structure.
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#FF6F61",
        }
      }
    },
  },
  plugins: [],
};

