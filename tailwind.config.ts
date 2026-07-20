import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#1c1917',
        surface: '#262220',
        'surface-border': '#3a3532',
        'text-primary': '#fafaf9',
        'text-secondary': '#a8a29e',
        accent: '#7c9885',
        'accent-foreground': '#1c1917',
      },
    },
  },
  plugins: [],
}

export default config
