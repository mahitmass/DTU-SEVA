/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./context/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#000000",
        panel: "#1A1A1A",
        alert: "#FF0000",
      },
      boxShadow: {
        glow: "0 0 28px rgba(255, 0, 0, 0.55)",
        glowSoft: "0 0 18px rgba(255, 0, 0, 0.28)",
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
