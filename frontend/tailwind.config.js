/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Luminary constellation palette
        void:    '#07080F',
        nebula:  '#0D1021',
        cosmos:  '#141729',
        star:    '#E8D9A0',
        pulsar:  '#A78BFA',
        nova:    '#60A5FA',
        quasar:  '#34D399',
        flare:   '#F472B6',
        dim:     '#4B5580',
        muted:   '#8892BB',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body:    ['"Inter"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow':  'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'float':       'float 6s ease-in-out infinite',
        'twinkle':     'twinkle 3s ease-in-out infinite',
        'glow':        'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
        glow: {
          from: { boxShadow: '0 0 10px rgba(167,139,250,0.3)' },
          to:   { boxShadow: '0 0 25px rgba(167,139,250,0.7), 0 0 50px rgba(167,139,250,0.3)' },
        },
      },
      backgroundImage: {
        'stellar': 'radial-gradient(ellipse at 20% 50%, rgba(167,139,250,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(96,165,250,0.08) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(52,211,153,0.05) 0%, transparent 50%)',
        'card-glow': 'linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(96,165,250,0.05) 100%)',
      },
    },
  },
  plugins: [],
}
