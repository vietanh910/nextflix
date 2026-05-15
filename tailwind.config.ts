import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#090b12",
        panel: "#131829",
        panelSoft: "#1b2135",
        textMain: "#f4f6ff",
        textMuted: "#9aa4c7",
        accent: "#5ad1b5",
        accentSoft: "#265f54",
      },
    },
  },
  plugins: [],
};

export default config;
