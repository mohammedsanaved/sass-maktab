// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
      fontFamily: {
        // This sets Poppins as the default font for the whole app
        sans: ['var(--font-poppins)', 'sans-serif'],
        urdu: ['"Noto Nastaliq Urdu"', 'serif'],
      },
      colors: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          500: '#2196f3',
          600: '#1e88e5',
          700: '#1976d2',
        },
        secondary: {
          500: '#9c27b0',
        },
      },
    },
    darkMode: 'class',
  plugins: [],
};

export default config;
