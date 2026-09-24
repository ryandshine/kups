/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        earth: {
          forest: {
            DEFAULT: '#2A572C',
            dark: '#1B3B1E',
            light: '#3D7840',
            tint: '#EBF2EB',
          },
          terracotta: {
            DEFAULT: '#BD4B24',
            dark: '#9E3B19',
            light: '#DC6339',
            tint: '#FBECE7',
          },
          clay: {
            DEFAULT: '#7D4D2B',
            dark: '#60391E',
            light: '#9E6740',
            tint: '#F5ECE5',
          },
          sand: {
            DEFAULT: '#F4F0E8',
            surface: '#EBE5D8',
            border: '#DCD4C2',
            dark: '#BDB19B',
          },
          soil: {
            DEFAULT: '#1B1917',
            light: '#292524',
            muted: '#57534E',
            secondary: '#78716C',
          }
        },
        tier: {
          blue: {
            DEFAULT: '#2563EB',
            bg: '#EFF6FF',
            border: '#BFDBFE',
            text: '#1D4ED8',
          },
          silver: {
            DEFAULT: '#4B5563',
            bg: '#F3F4F6',
            border: '#D1D5DB',
            text: '#374151',
          },
          gold: {
            DEFAULT: '#D97706',
            bg: '#FFFBEB',
            border: '#FDE68A',
            text: '#B45309',
          },
          platinum: {
            DEFAULT: '#0D766E',
            bg: '#F0FDFA',
            border: '#99F6E4',
            text: '#0F766E',
          },
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        // Enforce Flat Design: zero shadows
        DEFAULT: 'none',
        sm: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
        inner: 'none',
      },
    },
  },
  plugins: [],
}
