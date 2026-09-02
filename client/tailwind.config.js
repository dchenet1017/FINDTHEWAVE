/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        // Celebration overlay (AcceptedOfferCelebration)
        'wf-dance': {
          '0%, 100%': { transform: 'translateY(0) scale(1) rotate(-8deg)' },
          '25%': { transform: 'translateY(-14px) scale(1.08) rotate(6deg)' },
          '50%': { transform: 'translateY(0) scale(1) rotate(8deg)' },
          '75%': { transform: 'translateY(-8px) scale(1.05) rotate(-6deg)' },
        },
        'wf-pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.85) translateY(12px)' },
          '60%': { opacity: '1', transform: 'scale(1.03) translateY(0)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'wf-fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'wf-rise-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Drains left-to-right over the auto-dismiss window
        'wf-countdown': {
          '0%': { transform: 'scaleX(1)' },
          '100%': { transform: 'scaleX(0)' },
        },
      },
      animation: {
        'wf-dance': 'wf-dance 1.1s ease-in-out infinite',
        'wf-pop-in': 'wf-pop-in 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'wf-fade-in': 'wf-fade-in 0.25s ease-out both',
        'wf-rise-in': 'wf-rise-in 0.4s ease-out both',
        'wf-countdown': 'wf-countdown 3s linear forwards',
      },
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

