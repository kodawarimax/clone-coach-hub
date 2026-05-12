import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1A2E4A', dark: '#0F1E32' },
        gold: { DEFAULT: '#C8860F', bright: '#F5C842', light: '#FEF3C7' },
      },
    },
  },
  plugins: [],
};
export default config;
