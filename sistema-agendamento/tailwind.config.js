/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D3561', // Azul escuro
          50: '#F0F2F9',
          100: '#DDE2F3',
          200: '#BCC6EA',
          300: '#9AA9DF',
          400: '#798CD5',
          500: '#586FCB',
          600: '#3D52A0',
          700: '#2D3561', // Base
          800: '#1E2442',
          900: '#0F1221',
        },
        secondary: {
          DEFAULT: '#10B981', // Verde
          50: '#ECFDF5',
          100: '#D1FAE5',
          600: '#059669',
        },
        danger: {
          DEFAULT: '#EF4444',
          50: '#FEF2F2',
          600: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      }
    },
  },
  plugins: [],
}
