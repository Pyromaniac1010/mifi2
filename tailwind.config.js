/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Tech Navy — primary. navy-600 is the brand anchor (#003152).
        navy: {
          50: '#e7eef2',
          100: '#c2d4dd',
          200: '#9bb7c5',
          300: '#6b91a4',
          400: '#3f6e86',
          500: '#1b4f6b',
          600: '#003152',
          700: '#00263f',
          800: '#001b2e',
          900: '#00121f',
        },
        // Mint Trust — secondary. A refined, calm sage-mint (the bright
        // #02F5A1 fails text contrast on white, so this is the usable version).
        mint: {
          50: '#ecf6f1',
          100: '#d2ebe0',
          200: '#aed8c6',
          300: '#84c2a8',
          400: '#54a786',
          500: '#2f9670',
          600: '#23795a',
          700: '#1d6149',
          800: '#184d3b',
          900: '#143f31',
        },
      },
    },
  },
  plugins: [],
};
