/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8a63d2',
          50: '#f5f3fb',
          100: '#ebe7f6',
          200: '#d6ceee',
          300: '#bbaae2',
          400: '#a185d8',
          500: '#8a63d2',
          600: '#7249c3',
          700: '#633ca6',
          800: '#513387',
          900: '#44296e',
          950: '#301c4a',
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} 