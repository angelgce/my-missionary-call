/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        tablet: '768px',
        desktop: '1280px',
      },
      colors: {
        cream: '#FEF6F9',
        'warm-white': '#FFF8FA',
        gold: '#D4849B',
        'gold-dark': '#BE6B84',
        navy: '#3B2140',
        slate: '#726078',
        blush: '#F8E0E8',
        'rose-soft': '#F0CCD7',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        cursive: ['Dancing Script', 'cursive'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'cover-breathe': 'coverBreathe 3s ease-in-out infinite',
        'countdown-pulse': 'countdownPulse 2.5s ease-in-out infinite',
        'countdown-flip': 'countdownFlipIn 0.4s ease-out',
        'countdown-fade': 'countdownFadeUp 0.6s ease-out',
        'countdown-colon': 'countdownColon 1s ease-in-out infinite',
        'bounce-pin': 'bouncePin 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        coverBreathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.01)' },
        },
      },
    },
  },
  plugins: [],
};
