/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        xr: {
          // Required layered dark palette (SaaS style) - Enhanced for deeper contrast
          bg: '#05080E',
          surface: '#0B101A',
          elevated: '#131B2B',
          sidebar: '#080C14',

          // Lines / borders
          line: '#1E293B',
          border: 'rgba(255,255,255,0.08)',

          // Text
          text: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
          subtle: '#475569',

          // Accent + semantic (soft)
          brand: '#F59E0B',
          success: '#10B981',
          danger: '#EF4444',
          info: '#3B82F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        heading: ['"DM Sans"', 'Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
      },
      borderRadius: {
        // Enforce spec: cards 16px, controls 10px
        card: '16px',
        control: '10px',
      },
      fontSize: {
        // Fluid Typography scale
        display: ['clamp(2rem, 5vw, 2.75rem)', { lineHeight: '1.1', fontWeight: '600', letterSpacing: '-0.03em' }],
        h1: ['clamp(1.5rem, 4vw, 1.875rem)', { lineHeight: '1.15', fontWeight: '600', letterSpacing: '-0.02em' }],
        h2: ['clamp(1.125rem, 3vw, 1.25rem)', { lineHeight: '1.2', fontWeight: '500', letterSpacing: '-0.01em' }],
        h3: ['clamp(1rem, 2.5vw, 1.125rem)', { lineHeight: '1.35', fontWeight: '600', letterSpacing: '-0.01em' }],
        body: ['clamp(0.875rem, 1.5vw, 0.9375rem)', { lineHeight: '1.6', fontWeight: '400' }],
        caption: ['clamp(0.7rem, 1vw, 0.75rem)', { lineHeight: '1.4', fontWeight: '500' }],
      },
      maxWidth: {
        readable: '42rem',
        section: '72rem',
      },
      boxShadow: {
        panel: '0 10px 40px rgba(0,0,0,0.5)',
        soft: '0 8px 24px rgba(0,0,0,0.35)',
        glow: '0 0 20px rgba(245,158,11,0.15)',
        'glow-brand': '0 0 30px rgba(245,158,11,0.25)',
        'glow-success': '0 0 20px rgba(16,185,129,0.2)',
        'glow-info': '0 0 20px rgba(59,130,246,0.2)',
        'glow-lg': '0 0 40px rgba(245,158,11,0.3)',
        'inner-bright': 'inset 0 1px 0 rgba(255,255,255,0.07)',
        'elevated-soft': '0 4px 16px rgba(0,0,0,0.3)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'dot-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
          '50%': { transform: 'scale(1.35)', opacity: '1' },
        },
        'glow-once': {
          '0%': { boxShadow: '0 0 0 rgba(245,158,11,0)' },
          '60%': { boxShadow: '0 0 0 8px rgba(245,158,11,0.25)' },
          '100%': { boxShadow: '0 0 0 rgba(245,158,11,0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-up-sm': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        'slide-up-fade': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'expand-x': {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'left' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '70%': { transform: 'scale(1.04)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        'ping-sm': {
          '75%, 100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 420ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 300ms ease-out both',
        'dot-pulse': 'dot-pulse 1.4s ease-in-out infinite',
        'glow-once': 'glow-once 900ms ease-out both',
        'slide-in-right': 'slide-in-right 400ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-up-sm': 'scale-up-sm 450ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'shimmer': 'shimmer 2.2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 2.5s ease-in-out infinite',
        'slide-up-fade': 'slide-up-fade 350ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'expand-x': 'expand-x 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'pop-in': 'pop-in 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'spin-slow': 'spin-slow 3s linear infinite',
        'ping-sm': 'ping-sm 1.2s cubic-bezier(0,0,0.2,1) infinite',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-in': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}