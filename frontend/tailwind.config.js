export default {
  darkMode: "class",
  content: ["./index.html","./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        glass: "0 10px 30px rgba(2,6,23,0.12)",
      },
      colors: {
        glass: {
          light: "rgba(255,255,255,0.6)",
          dark: "rgba(2,6,23,0.45)",
        },
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
}
