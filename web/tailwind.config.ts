import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary-purple': '#7B5BF5',
        'secondary-purple': '#B5A2FA',
        'accent-blue': '#4F7BFF',
        'surface-light': '#F7F5FF',
        'text-primary': '#1A1A2E',
        'text-secondary': '#6B6B85',
        success: '#4CAF50',
        warning: '#FFA726',
        danger: '#EF5350',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
