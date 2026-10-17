/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          start: '#6A5AF9',
          end: '#5CE1E6',
        },
      },
      boxShadow: {
        glow: '0 0 20px rgba(108,99,255,0.35)',
      },
      backdropBlur: {
        30: '30px',
      },
      borderRadius: {
        'xl2': '20px',
      }
    },
  },
  plugins: [],
}
