import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blade: {
          red: "#C0392B",
          "red-dark": "#96281B",
          dark: "#1A1A1A",
          "dark-2": "#252525",
          "dark-3": "#2F2F2F",
          cream: "#F5F0E8",
          "cream-dark": "#EDE8DF",
          steel: "#8B9CAB",
          "steel-light": "#B0BEC5",
        },
      },
      fontFamily: {
        display: ["Barlow Condensed", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
