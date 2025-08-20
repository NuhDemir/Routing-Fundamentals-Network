/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Vite'ın ana HTML dosyası
    "./src/**/*.{js,ts,jsx,tsx}", // src klasöründeki tüm React component'leri
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
