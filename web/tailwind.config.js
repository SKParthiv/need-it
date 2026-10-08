/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '360px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        brand: {
          indigo: '#4F46E5',
          'indigo-dark': '#3730A3',
          'indigo-light': '#EEF2FF',
          'indigo-darkmode': '#818CF8',
          coral: '#FF6B3D',
          'coral-dark': '#E55627',
          teal: '#0F766E',
          'teal-dark': '#115E59',
          'teal-light': '#F0FDFA',
          'teal-tint': '#CCFBF1',
        },
        semantic: {
          success: '#166534',
          'success-tint': '#DCFCE7',
          'success-dark': '#4ADE80',
          warning: '#B45309',
          'warning-tint': '#FEF3C7',
          'warning-dark': '#FBBF24',
          danger: '#B91C1C',
          'danger-tint': '#FEE2E2',
          'danger-dark': '#F87171',
          info: '#0369A1',
          'info-tint': '#E0F2FE',
          'info-dark': '#38BDF8',
          handover: '#6D28D9',
          'handover-tint': '#EDE9FE',
          'handover-dark': '#A78BFA',
        },
        neutral: {
          ink: '#0B1020',
          body: '#1E293B',
          secondary: '#475569',
          placeholder: '#64748B',
          disabled: '#94A3B8',
          border: '#E2E8F0',
          'surface-alt': '#F1F5F9',
          'page-bg': '#F8FAFC',
          card: '#FFFFFF',
          // Dark mode
          'dark-page': '#0B1020',
          'dark-card': '#141A2E',
          'dark-border': '#27304A',
          'dark-text': '#E6EAF5',
          'dark-secondary': '#9AA6C4',
        }
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'input': '8px',
        'chip': '8px',
        'btn': '12px',
        'card': '16px',
        'panel': '24px',
        'sheet': '24px',
      },
      boxShadow: {
        'e1': '0 1px 2px rgba(15,23,42,0.06)',
        'e2': '0 4px 16px rgba(15,23,42,0.08)',
        'e3': '0 12px 32px rgba(15,23,42,0.14)',
      },
      maxWidth: {
        'prose-custom': '65ch',
        'content': '1200px',
        'hero': '1440px',
      },
      transitionTimingFunction: {
        'enter': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'exit': 'cubic-bezier(0.4, 0, 1, 1)',
        'standard': 'cubic-bezier(0.2, 0, 0, 1)',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'slow': '400ms',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
        beacon: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(1.2)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 250ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-out': 'fadeOut 200ms cubic-bezier(0.4, 0, 1, 1) forwards',
        'slide-up': 'slideUp 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-down': 'slideDown 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'scale-in': 'scaleIn 200ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'shake': 'shake 300ms ease-in-out',
        'beacon': 'beacon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-subtle': 'pulseSubtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
