/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontSize: {
        meta: ['var(--font-size-meta)', { lineHeight: '1rem' }],
        nav: ['var(--font-size-nav)', { lineHeight: '0.875rem' }],
      },
      fontFamily: {
        sans: ['"Manrope"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        gold: {
          50: '#fbf7ea',
          100: '#f5ebc9',
          200: '#ebd694',
          300: '#dfbe5c',
          400: '#d4aa38',
          500: '#c9a227',
          600: '#a67f1f',
          700: '#7d5d1c',
          800: '#5c441c',
          900: '#3d2e15',
        },
        graphite: {
          50: '#f6f6f7',
          100: '#e2e2e5',
          200: '#c5c5cb',
          300: '#9a9aa4',
          400: '#6f6f7b',
          500: '#4e4e58',
          600: '#3a3a42',
          700: '#2a2a31',
          800: '#1c1c21',
          900: '#131317',
          950: '#0b0b0d',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      spacing: {
        control: 'var(--control-height)',
      },
      boxShadow: {
        surface: '0 1px 2px rgb(0 0 0 / 0.12), 0 8px 24px rgb(0 0 0 / 0.04)',
        elevated: '0 18px 48px rgb(0 0 0 / 0.22)',
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
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.25s ease-out both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
