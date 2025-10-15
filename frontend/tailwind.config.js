/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ihsan: {
          // Deep Islamic-inspired palette
          primary: "#0F4C75", // Deep ocean blue
          secondary: "#1B998B", // Teal green
          accent: "#D4AF37", // Golden
          dark: "#0A1931", // Deep navy
          light: "#F0F4F8", // Soft white
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-islamic":
          "linear-gradient(135deg, #0F4C75 0%, #1B998B 50%, #0A1931 100%)",
        "gradient-gold": "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)",
        "gradient-teal": "linear-gradient(135deg, #1B998B 0%, #0F4C75 100%)",
      },
      boxShadow: {
        islamic: "0 10px 40px rgba(15, 76, 117, 0.3)",
        "islamic-lg": "0 20px 60px rgba(15, 76, 117, 0.4)",
        gold: "0 8px 32px rgba(212, 175, 55, 0.25)",
        "inner-glow": "inset 0 0 20px rgba(27, 153, 139, 0.2)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(27, 153, 139, 0.5)" },
          "100%": { boxShadow: "0 0 40px rgba(27, 153, 139, 0.8)" },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        emerald: {
          primary: "#0F4C75",
          secondary: "#1B998B",
          accent: "#D4AF37",
          neutral: "#0A1931",
          "base-100": "#FFFFFF",
          "base-200": "#F0F4F8",
          "base-300": "#E2E8F0",
          info: "#1B998B",
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
        },
      },
      "light",
      "dark",
    ],
    darkTheme: "dark",
  },
};
