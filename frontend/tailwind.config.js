/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2F5FF0',
          hover: '#2749C4',
          light: '#EEF2FF',
        },
        navy: {
          DEFAULT: '#0B1220',
          800: '#111A30',
          700: '#1A2540',
          600: '#26335A',
          400: '#5A6889',
          300: '#8894B3',
        },
        ink: {
          900: '#0F172A',
          700: '#334155',
          500: '#64748B',
          300: '#CBD5E1',
          100: '#F1F5F9',
        },
        risk: {
          high: '#DC2626',
          'high-bg': '#FEF2F2',
          'high-border': '#FECACA',
          medium: '#D97706',
          'medium-bg': '#FFFBEB',
          'medium-border': '#FDE68A',
          low: '#16A34A',
          'low-bg': '#F0FDF4',
          'low-border': '#BBF7D0',
        },
      },
      borderRadius: {
        card: '1rem',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.06)',
        'card-hover': '0 4px 12px 0 rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
