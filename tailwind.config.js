module.exports = {
  darkMode: 'class',
  content: ['./index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        gym: {
          bg: '#09090b',
          card: '#141417',
          elevated: '#1e1e24',
          border: '#27272f',
          accent: '#ccff00',
          accentHover: '#b8e600',
        }
      }
    }
  }
}
