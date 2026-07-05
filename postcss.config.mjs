/** Tailwind v4 runs entirely as a PostCSS plugin — no tailwind.config.js needed.
 * The design tokens live in src/app/globals.css under @theme. */
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
