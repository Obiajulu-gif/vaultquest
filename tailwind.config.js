/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./stellar-wallet-connect/src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: "var(--vq-bg)",
          surface: "var(--vq-surface)",
          text: "var(--vq-text)",
          muted: "var(--vq-muted)",
          border: "var(--vq-border)",
          accent: "var(--vq-accent)",
          "accent-glow": "var(--vq-accent-glow)",
        },
      },
      boxShadow: {
        glass: "var(--vq-shadow-glass)",
        glow: "var(--vq-shadow-glow)",
      },
      backgroundImage: {
        "glass-gradient": "var(--vq-glass-gradient)",
      },
      transitionDuration: {
        DEFAULT: "300ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
      },
    },
  },
  plugins: [],
};
