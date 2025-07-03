import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F7FF00', // Electric Yellow
        secondary: '#0052FF', // Strong Blue
        dark: '#111111', // Off-black
        light: '#FFFFFF',
        neutral: '#F2F2F2', // Light gray background
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Archivo Black', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        'hard': '4px 4px 0px #111111',
        'hard-lg': '8px 8px 0px #111111',
        'hard-primary': '4px 4px 0px #F7FF00',
        'hard-secondary': '4px 4px 0px #0052FF',
      },
    },
  },
  plugins: [],
};
export default config; 