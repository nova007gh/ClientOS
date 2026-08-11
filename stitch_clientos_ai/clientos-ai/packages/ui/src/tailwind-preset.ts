/** ClientOS AI — Tailwind CSS preset (matches DESIGN.md color system) */
import type { Config } from 'tailwindcss';

const config: Partial<Config> = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0b1326',
          dim: '#0b1326',
          bright: '#31394d',
          'container-lowest': '#060e20',
          'container-low': '#131b2e',
          container: '#171f33',
          high: '#222a3d',
          highest: '#2d3449',
        },
        'on-surface': {
          DEFAULT: '#dae2fd',
          variant: '#c1c6d7',
        },
        'inverse-surface': '#dae2fd',
        'inverse-on-surface': '#283044',
        outline: {
          DEFAULT: '#8b90a0',
          variant: '#414755',
        },
        'surface-tint': '#adc6ff',
        'surface-variant': '#2d3449',
        primary: {
          DEFAULT: '#adc6ff',
          container: '#4b8eff',
          'on-container': '#00285c',
          fixed: '#d8e2ff',
          'fixed-dim': '#adc6ff',
          'on-fixed': '#001a41',
          'on-fixed-variant': '#004493',
        },
        'on-primary': '#002e69',
        'inverse-primary': '#005bc1',
        secondary: {
          DEFAULT: '#4edea3',
          container: '#00a572',
          'on-container': '#00311f',
          fixed: '#6ffbbe',
          'fixed-dim': '#4edea3',
          'on-fixed': '#002113',
          'on-fixed-variant': '#005236',
        },
        'on-secondary': '#003824',
        tertiary: {
          DEFAULT: '#c0c1ff',
          container: '#8083ff',
          'on-container': '#0d0096',
          fixed: '#e1e0ff',
          'fixed-dim': '#c0c1ff',
          'on-fixed': '#07006c',
          'on-fixed-variant': '#2f2ebe',
        },
        'on-tertiary': '#1000a9',
        error: {
          DEFAULT: '#ffb4ab',
          container: '#93000a',
          'on-container': '#ffdad6',
        },
        'on-error': '#690005',
        background: '#0b1326',
        'on-background': '#dae2fd',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        headline: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        'label-caps': ['JetBrains Mono', 'monospace'],
        'lead-score': ['Inter', 'sans-serif'],
      },
      fontSize: {
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-caps': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '500' }],
        'lead-score': ['14px', { lineHeight: '14px', fontWeight: '700' }],
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px',
      },
      spacing: {
        unit: '4px',
        'container-padding': '24px',
        'card-gap': '12px',
        gutter: '16px',
        'sidebar-width': '240px',
      },
    },
  },
};

export default config;
