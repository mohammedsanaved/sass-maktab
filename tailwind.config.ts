// // tailwind.config.ts
// import type { Config } from 'tailwindcss';

// const config: Config = {
//   content: [
//     './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
//     './src/components/**/*.{js,ts,jsx,tsx,mdx}',
//     './src/app/**/*.{js,ts,jsx,tsx,mdx}',
//   ],
//   theme: {
//     fontFamily: {
//       // This sets Poppins as the default font for the whole app
//       sans: ['var(--font-poppins)', 'sans-serif'],
//       urdu: ['"Noto Nastaliq Urdu"', 'serif'],
//     },
//     colors: {
//       primary: {
//         50: '#e3f2fd',
//         100: '#bbdefb',
//         500: '#2196f3',
//         600: '#1e88e5',
//         700: '#1976d2',
//       },
//       secondary: {
//         500: '#9c27b0',
//       },
//     },
//   },
//   darkMode: 'class',
//   plugins: [],
// };

// export default config;
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    // Theme is now managed in src/app/globals.css using @theme block
    // extend: {
    //   fontFamily: {
    //     sans: ['var(--font-poppins)', 'sans-serif'],
    //     urdu: ['"Noto Nastaliq Urdu"', 'serif'],
    //   },
    //   colors: {
    //     background: 'var(--background)',
    //     foreground: 'var(--foreground)',
    //     primary: {
    //       50: 'var(--primary-50)',
    //       100: 'var(--primary-100)',
    //       500: 'var(--primary-500)',
    //       600: 'var(--primary-600)',
    //       700: 'var(--primary-700)',
    //     },
    //     secondary: {
    //       500: 'var(--secondary-500)',
    //     },
    //   },
    // },
  },
  plugins: [],
};

export default config;
