import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        graphite: '#2A2A2A',
        purple: '#B968FF',
        magenta: '#FF4FC9',
        'graphite-light': '#3B3B3B',
        'graphite-dark': '#1E1E1E',
        'purple-light': '#CF8EFF',
        'purple-dark': '#9449D6',
        'magenta-light': '#FF80D3',
        'magenta-dark': '#CC3C99'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif']
      },
      boxShadow: {
        glass: '0 10px 20px rgba(0,0,0,0.25), inset 0 0 10px rgba(255,255,255,0.05)'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
}

export default config