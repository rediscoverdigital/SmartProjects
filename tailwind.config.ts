import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#0A0F16',
          900: '#0C1824',
          800: '#122031',
          700: '#1B2C40',
          600: '#26394F',
        },
        brass: {
          50: '#FAF6EC',
          100: '#F2E9D3',
          200: '#E6D3A6',
          300: '#D6BC7E',
          400: '#C0A86C',
          500: '#AE9455',
          600: '#8E7642',
          700: '#6D5A33',
        },
        cream: {
          50: '#FBFBF6',
          100: '#F0F0E4',
          200: '#E4E4D8',
          300: '#D8D8CC',
        },
        sage: {
          300: '#B4C0A8',
          500: '#7E8F72',
          700: '#4F5C46',
        },
        ember: {
          400: '#D9762F',
          500: '#C25E1E',
        },
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.4)', opacity: '0' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.8s infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
