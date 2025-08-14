/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        primary: {
          DEFAULT: '#0D6EFD',
          50: '#EAF2FF',
          100: '#D4E5FF',
          200: '#B3D1FF',
          300: '#85B8FF',
          400: '#5A9BFF',
          500: '#0D6EFD',
          600: '#0B5FE3',
          700: '#0A52C9',
          800: '#0945AF',
          900: '#1E40AF',
          dark: '#60A5FA'
        },
        accent: {
          DEFAULT: '#FF6A00',
          50: '#FFF4E6',
          100: '#FFE9CC',
          200: '#FFD399',
          300: '#FFBD66',
          400: '#FF9333',
          500: '#FF6A00',
          600: '#E55A00',
          700: '#CC4A00',
          800: '#B33A00',
          900: '#992A00',
          dark: '#FF8A33'
        },
        success: {
          DEFAULT: '#16A34A',
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#16A34A',
          600: '#15803D',
          700: '#166534',
          800: '#14532D',
          900: '#052E16',
          dark: '#22C55E'
        },
        neutral: {
          DEFAULT: '#0F172A',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617'
        },
        // Surface colors for light/dark mode
        surface: {
          light: '#FFFFFF',
          dark: '#111827'
        },
        background: {
          light: '#F8FAFC',
          dark: '#0B1220'
        },
        border: {
          light: '#E5E7EB',
          dark: '#1F2937'
        },
        text: {
          light: '#0F172A',
          dark: '#E5E7EB'
        }
      },
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['Roboto Mono', 'monospace']
      },
      fontSize: {
        'h1': ['28px', { lineHeight: '140%', fontWeight: '600' }],
        'h2': ['22px', { lineHeight: '140%', fontWeight: '600' }],
        'h3': ['18px', { lineHeight: '140%', fontWeight: '500' }],
        'body': ['16px', { lineHeight: '140%', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '120%', fontWeight: '400' }],
        'price': ['16px', { lineHeight: '120%', fontWeight: '500' }]
      },
      spacing: {
        '4pt': '4px',
        '8pt': '8px',
        '12pt': '12px',
        '16pt': '16px',
        '24pt': '24px',
        '32pt': '32px'
      },
      borderRadius: {
        'card': '12px',
        'button': '20px',
        'chip': '16px'
      },
      boxShadow: {
        'card-light': '0 6px 16px rgba(0, 0, 0, 0.08)',
        'card-dark': '0 6px 16px rgba(255, 255, 255, 0.06)'
      },
      height: {
        'button-l': '56px',
        'button-m': '48px',
        'button-s': '40px'
      },
      animation: {
        'bounce-subtle': 'bounceSubtle 150ms ease-out',
        'shimmer': 'shimmer 1200ms ease-in-out infinite'
      },
      keyframes: {
        bounceSubtle: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' }
        },
        shimmer: {
          '0%': { opacity: '1' },
          '50%': { opacity: '0.5' },
          '100%': { opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}
