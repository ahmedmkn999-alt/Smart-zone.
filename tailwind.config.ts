import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#05070c",
        deep: "#0a1220",
        silver: "#e3e8ee",
        "silver-dim": "#8d97a6",
        ice: "#6fc9ff",
        "ice-dim": "#4d7ba3",
        gold: "#cda76b",
        good: "#5fd68f",
        danger: "#ff6b6b"
      },
      fontFamily: {
        cairo: ["Cairo", "sans-serif"],
        tajawal: ["Tajawal", "sans-serif"]
      },
      borderRadius: {
        xl2: "22px"
      }
    }
  },
  plugins: []
};

export default config;
