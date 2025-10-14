/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ihsan: {
          primary: "#2E7D32",
          accent: "#CDA434",
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        ihsan: {
          primary: "#2E7D32",
          secondary: "#CDA434",
          accent: "#CDA434",
          neutral: "#2a323c",
          "base-100": "#1d232a",
        },
      },
      "light",
      "dark",
      "emerald",
    ],
  },
};
