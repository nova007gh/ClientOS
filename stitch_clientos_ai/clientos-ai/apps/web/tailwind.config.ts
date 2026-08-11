import type { Config } from 'tailwindcss';
import preset from '../../packages/ui/src/tailwind-preset';

const config: Config = {
  ...preset,
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};

export default config;
