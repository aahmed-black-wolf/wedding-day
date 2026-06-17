/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        blush: "#f7d9d9",
        rose: "#e8a0a8",
        wine: "#7d2b3a",
        cream: "#fff7f1",
        gold: "#c9a44c",
        ink: "#3a2630",
      },
      fontFamily: {
        body: ["var(--font-cairo)", "system-ui", "sans-serif"],
        display: ["var(--font-aref)", "serif"],
      },
      keyframes: {
        floatUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        floatUp: "floatUp 0.8s ease-out both",
        shimmer: "shimmer 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
