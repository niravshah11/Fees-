import type { Config } from 'tailwindcss';
import fountainhead from '@fountainhead/design-system/tailwind-preset';

export default {
  presets: [fountainhead],
  content: ['./app/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}', './engine/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Same override as the event-management app: font-heading/font-body resolve to the
      // next/font-loaded Plus Jakarta Sans (app/fonts.ts) instead of the preset's default.
      fontFamily: {
        heading: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
        body: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
