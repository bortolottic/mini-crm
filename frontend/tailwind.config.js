/** Tailwind apontando para os mesmos tokens de src/styles/tokens.css.
 *
 * Adaptado do Vision.AI. Lá `borderRadius`/`boxShadow` ainda estavam zerados
 * (resto da gramática editorial anterior); aqui apontam para a escala atual
 * dos tokens (raio 2·4·8·12, três sombras) — a mesma que o lint de design aceita.
 */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--v-bg)',
        surface: 'var(--v-surface)',
        'surface-2': 'var(--v-surface-2)',
        ink: {
          DEFAULT: 'var(--v-ink)',
          60: 'var(--v-ink-60)',
          40: 'var(--v-ink-40)',
          7: 'var(--v-ink-07)',
        },
        rule: { DEFAULT: 'var(--v-rule)', light: 'var(--v-rule-light)' },
        accent: {
          DEFAULT: 'var(--v-accent)',
          100: 'var(--v-accent-100)',
          200: 'var(--v-accent-200)',
          300: 'var(--v-accent-300)',
          400: 'var(--v-accent-400)',
          500: 'var(--v-accent-500)',
          600: 'var(--v-accent-600)',
          700: 'var(--v-accent-700)',
          800: 'var(--v-accent-800)',
          900: 'var(--v-accent-900)',
          text: 'var(--v-accent-text)',
        },
        neutral: {
          100: 'var(--v-neutral-100)',
          200: 'var(--v-neutral-200)',
          300: 'var(--v-neutral-300)',
          400: 'var(--v-neutral-400)',
          500: 'var(--v-neutral-500)',
          600: 'var(--v-neutral-600)',
          700: 'var(--v-neutral-700)',
          800: 'var(--v-neutral-800)',
          900: 'var(--v-neutral-900)',
        },
        state: {
          critical: 'var(--v-state-critical)',
          warning: 'var(--v-state-warning)',
          normal: 'var(--v-state-normal)',
          idle: 'var(--v-state-idle)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      maxWidth: { container: 'var(--v-container)', prosa: 'var(--v-prosa)' },
    },
    borderRadius: {
      none: '0',
      sm: 'var(--v-radius-sm)',
      DEFAULT: 'var(--v-radius)',
      lg: 'var(--v-radius-lg)',
      xl: 'var(--v-radius-xl)',
      full: '9999px',
    },
    boxShadow: {
      none: 'none',
      sm: 'var(--v-shadow-sm)',
      DEFAULT: 'var(--v-shadow)',
      lg: 'var(--v-shadow-lg)',
    },
  },
  plugins: [],
}
