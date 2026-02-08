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
        background: "#FAFAF7",
        primary: "#7C9A82",
        accent: "#8BA4B8",
        gray: "#9B9B8E",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        serif: ["Noto Serif JP", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
