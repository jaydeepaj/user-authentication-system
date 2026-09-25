/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary — Neon Cyan
        primary: {
          50:  '#e0fcfd',
          100: '#bef5f8',
          200: '#7eeef3',
          300: '#3ee6ee',
          400: '#22D3EE', // Accent Color
          500: '#00E5FF', // Primary Neon Cyan
          600: '#00b7cc',
          700: '#008b99',
          800: '#005d66',
          900: '#002e33',
        },
        // Secondary — Neon Purple
        secondary: {
          50:  '#f5f2ff',
          100: '#ece5ff',
          200: '#d5bfff',
          300: '#b78fff',
          400: '#9b66ff',
          500: '#7C3AED', // Secondary Neon Purple
          600: '#632ec4',
          700: '#4b1f9c',
          800: '#341373',
          900: '#1c084a',
        },
        // Danger — Red
        danger: {
          400: '#f87171',
          500: '#EF4444', // Danger Red
          600: '#dc2626',
        },
        // Success — Green
        success: {
          400: '#34d399',
          500: '#10B981', // Success Green
          600: '#059669',
        },
        // Warning — Amber
        warning: {
          400: '#fbbf24',
          500: '#F59E0B', // Warning Amber
          600: '#d97706',
        },
        // Dark backgrounds (Primary Background is #0A0F1C)
        dark: {
          50:  '#e2e4eb',
          100: '#b9becd',
          200: '#9098af',
          300: '#677292',
          400: '#4c577b',
          500: '#384568',
          550: '#2f3b60',
          600: '#202a46',
          700: '#172037',
          800: '#10172a',
          900: '#0A0F1C', // Background Hex
          950: '#050811',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cyber-grid': "linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)",
        'hero-gradient': 'linear-gradient(135deg, #0A0F1C 0%, #10172a 50%, #0A0F1C 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(16,23,42,0.9) 0%, rgba(10,15,28,0.9) 100%)',
        'primary-gradient': 'linear-gradient(135deg, #00E5FF 0%, #7C3AED 100%)',
        'danger-gradient': 'linear-gradient(135deg, #EF4444 0%, #f87171 100%)',
      },
      boxShadow: {
        'glow-cyan': '0 0 25px rgba(0, 229, 255, 0.4)',
        'glow-purple': '0 0 25px rgba(124, 58, 237, 0.4)',
        'glow-red': '0 0 25px rgba(239, 68, 68, 0.4)',
        'glow-green': '0 0 25px rgba(16, 185, 129, 0.4)',
        'glow-sm': '0 0 12px rgba(0, 229, 255, 0.25)',
        'glow-neon-border': '0 0 15px rgba(0, 229, 255, 0.15), inset 0 0 10px rgba(0, 229, 255, 0.05)',
        'card': '0 4px 30px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 10px 45px rgba(0, 0, 0, 0.7)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(0, 240, 255, 0.6)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
