import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dde8ff',
          200: '#c2d4ff',
          300: '#9ab6fe',
          400: '#708dfb',
          500: '#4f65f7',
          600: '#3944eb',
          700: '#2f34d0',
          800: '#2a2fa8',
          900: '#272e84',
          950: '#1a1d51',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
