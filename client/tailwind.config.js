/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6C5CE7',
        'primary-light': '#A29BFE',
        secondary: '#00D2D3',
        accent: '#FF9F43',
        'dark-bg': '#181818',
        'dark-card': '#242424',
        success: '#00B894',
        warning: '#FDCB6E',
        danger: '#FF7675',
      },
    },
  },
  plugins: [],
}

