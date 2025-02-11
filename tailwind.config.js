/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(10px)',
      },
      backgroundColor: {
        'glass': 'rgba(255, 255, 255, 0.15)',
      },
      borderColor: {
        'glass': 'rgba(255, 255, 255, 0.2)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.glassmorphism': {
          'background': 'rgba(255, 255, 255, 0.15)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
          'border-radius': '15px',
          'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
      });
    },
  ],
};