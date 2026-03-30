/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cinzel', 'Georgia', 'serif'],
        body: ['Crimson Text', 'Georgia', 'serif'],
        sans: ['Crimson Text', 'Georgia', 'serif'],
      },
      colors: {
        background: 'oklch(var(--background) / <alpha-value>)',
        foreground: 'oklch(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'oklch(var(--card) / <alpha-value>)',
          foreground: 'oklch(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
          foreground: 'oklch(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
          foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
          foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
          foreground: 'oklch(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
          foreground: 'oklch(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
          foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'oklch(var(--border) / <alpha-value>)',
        input: 'oklch(var(--input) / <alpha-value>)',
        ring: 'oklch(var(--ring) / <alpha-value>)',
        gold: {
          DEFAULT: '#d4a017',
          dim: '#8a6a10',
          bright: '#f0c040',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'gold-glow': '0 0 8px #d4a017, 0 0 16px rgba(212, 160, 23, 0.3)',
        'gold-sm': '0 0 4px rgba(212, 160, 23, 0.5)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'rainbow-shift': {
          '0%':   { color: '#ff0000' },
          '15%':  { color: '#ff8800' },
          '30%':  { color: '#ffff00' },
          '45%':  { color: '#00ff00' },
          '60%':  { color: '#0088ff' },
          '75%':  { color: '#8800ff' },
          '90%':  { color: '#ff00ff' },
          '100%': { color: '#ff0000' },
        },
        'rainbow-border-shift': {
          '0%':   { borderColor: '#ff0000', boxShadow: '0 0 8px #ff0000' },
          '15%':  { borderColor: '#ff8800', boxShadow: '0 0 8px #ff8800' },
          '30%':  { borderColor: '#ffff00', boxShadow: '0 0 8px #ffff00' },
          '45%':  { borderColor: '#00ff00', boxShadow: '0 0 8px #00ff00' },
          '60%':  { borderColor: '#0088ff', boxShadow: '0 0 8px #0088ff' },
          '75%':  { borderColor: '#8800ff', boxShadow: '0 0 8px #8800ff' },
          '90%':  { borderColor: '#ff00ff', boxShadow: '0 0 8px #ff00ff' },
          '100%': { borderColor: '#ff0000', boxShadow: '0 0 8px #ff0000' },
        },
        'scroll-up': {
          '0%':   { transform: 'translateY(0)' },
          '10%':  { transform: 'translateY(0)' },
          '90%':  { transform: 'translateY(var(--scroll-distance, -50%))' },
          '100%': { transform: 'translateY(var(--scroll-distance, -50%))' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'rainbow-text': 'rainbow-shift 3s linear infinite',
        'rainbow-border': 'rainbow-border-shift 3s linear infinite',
        'scroll-up': 'scroll-up 20s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
  ],
};
