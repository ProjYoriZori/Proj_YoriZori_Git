/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          orange: '#FFB067',
          green: '#86D3A5',
        },
        bg: '#FFFDF9',
        surface: '#FFFFFF',
        text: '#4A4A4A',
        muted: '#9CA3AF',
        warn: '#FF6B6B',
        banana: '#FFD93D',
      },
      borderRadius: {
        '3xl': '24px',
        '2xl': '16px',
        '4xl': '28px',
      },
    },
  },
  plugins: [],
};
