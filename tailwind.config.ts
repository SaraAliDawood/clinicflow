import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: { DEFAULT: '#2dd4bf', soft: 'rgba(45,212,191,0.12)' },
      },
    },
  },
  plugins: [],
} satisfies Config;
