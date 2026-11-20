/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        reserve: {
          50: '#fbf9f6',
          100: '#f6f1ea',
          200: '#ede1d2',
          300: '#dfcbaf',
          400: '#cbb087',
          500: '#ba9565',
          600: '#aa8153',
          700: '#8d6842',
          800: '#725439',
          900: '#5e4631',
          950: '#332317',
        },
        charcoal: {
          800: '#1e2229',
          900: '#14171d',
          950: '#0d0f13',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
