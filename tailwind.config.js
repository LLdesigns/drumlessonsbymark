/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Play It Pro Color Scheme
        'gray-light': '#D9D9D9',
        'green-primary': '#6DC857',
        'gray-medium': '#99A098',
        'gray-dark': '#3C413B',
        'gray-darker': '#242923',
        
        // Legacy colors (keeping for compatibility)
        primary: '#6DC857',
        secondary: '#3C413B',
        tertiary: '#242923',
        'primary-bg': '#242923',
        'secondary-bg': '#3C413B',
        'primary-text': '#D9D9D9',
      },
      fontFamily: {
        'jost': ['Jost', 'Arial', 'sans-serif'],
        'unbounded': ['Unbounded', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
