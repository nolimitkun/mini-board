/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Google blue ("Cloud" primary)
        primary: {
          50: '#e8f0fe',
          100: '#d2e3fc',
          200: '#aecbfa',
          300: '#8ab4f8',
          400: '#669df6',
          500: '#4285f4',
          600: '#1a73e8',
          700: '#1967d2',
          800: '#185abc',
          900: '#174ea6',
        },
        // Google Material neutral palette
        gray: {
          50: '#f8f9fa',
          100: '#f1f3f4',
          200: '#e8eaed',
          300: '#dadce0',
          400: '#bdc1c6',
          500: '#9aa0a6',
          600: '#5f6368',
          700: '#3c4043',
          800: '#303134',
          900: '#202124',
        },
        // Google brand accents
        google: {
          blue: '#4285f4',
          red: '#ea4335',
          yellow: '#fbbc04',
          green: '#34a853',
        },
      },
      fontFamily: {
        sans: ['"Google Sans Text"', 'Roboto', 'system-ui', 'Arial', 'sans-serif'],
        display: ['"Google Sans"', '"Google Sans Text"', 'Roboto', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Google Material elevation
        'soft': '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
        'card': '0 1px 3px 0 rgba(60,64,67,.15), 0 4px 8px 3px rgba(60,64,67,.05)',
      },
    },
  },
  plugins: [],
}
