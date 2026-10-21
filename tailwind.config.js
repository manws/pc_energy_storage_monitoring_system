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
        screen: { 950: '#eef4f0', 900: '#f4f8f5', 800: '#ffffff' },
        slate: {
          50: '#0b1a15', 100: '#14261f', 200: '#22352d', 300: '#3f5249', 400: '#6a7b73',
          500: '#8b9a93', 600: '#b4c0ba', 700: '#d5ded9', 800: '#e7eeea', 900: '#f3f7f5'
        },
        cyan: {
          50: '#06402b', 100: '#0b5e40', 200: '#0e7a52', 300: '#10a36b', 400: '#34c38f',
          500: '#10a36b', 600: '#0b8456', 700: '#0a6a46', 800: '#0a553a', 900: '#094631'
        },
        sky: {
          300: '#2a9d8f', 400: '#238a7e', 500: '#1d766c'
        },
        emerald: {
          300: '#14a06a', 400: '#0f9a62', 500: '#0b8456', 600: '#0a6a46'
        },
        amber: {
          300: '#c77d06', 400: '#d97706', 500: '#b45309'
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
