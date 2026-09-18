import type { Config } from 'tailwindcss';
// Relative path — see app/layout.tsx's comment on the CSS import for why this isn't the bare
// '@fountainhead/design-system/tailwind-preset' specifier. TypeScript infers this plain JS
// file's shape structurally (allowJs) rather than treating it as untyped, and that inferred
// shape doesn't line up with Tailwind's own `DarkModeConfig` — cast it the same way an ambient
// `declare module` for the bare specifier used to (implicitly) do.
import fountainheadRaw from './vendor/fountainhead-design-system/tailwind/fountainhead-preset.js';
const fountainhead = fountainheadRaw as unknown as Partial<Config>;

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
