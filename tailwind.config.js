/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      fontFamily: {
        num: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
        sans: ['Instrument Sans', 'PingFang SC', 'HarmonyOS Sans SC', 'Microsoft YaHei', 'sans-serif']
      },
      colors: {
        screen: { 950: '#020814', 900: '#04101c', 800: '#07182c' },
        slate: {
          50: '#f4fbff', 100: '#e7f6ff', 200: '#c5e6f5', 300: '#9fd0e6', 400: '#7eb4cc',
          500: '#5d8eaa', 600: '#3e6d88', 700: '#245068', 800: '#1c4d6e', 900: '#0c2236'
        },
        cyan: {
          50: '#e7fbff', 100: '#b8f3ff', 200: '#7ee7ff', 300: '#3ad4ff', 400: '#14c0f0',
          500: '#0aa4d6', 600: '#0784b0', 700: '#086888', 800: '#0a4e68', 900: '#08384c'
        },
        sky: {
          300: '#7ee7ff', 400: '#3ad4ff', 500: '#14c0f0'
        },
        emerald: {
          300: '#7dffc3', 400: '#2ee59a', 500: '#1ed98a', 600: '#12b874'
        },
        amber: {
          300: '#ffe08a', 400: '#f5c15a', 500: '#e0a43a'
        },
        red: {
          400: '#e03b3b', 500: '#dc2626'
        },
        pink: { 300: '#d9577f' },
        orange: { 300: '#e07a2e' }
      }
    }
  },
  safelist: ['text-emerald-400', 'text-amber-400', 'text-red-400', 'text-sky-400', 'text-slate-400'],
  plugins: []
};
