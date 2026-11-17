// Motion helper for Svelte transitions, which do not follow prefers-reduced-motion on their own.
const reduced = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

/** Duration in ms, or 0 when the user asked for reduced motion. */
export const motion = (ms) => (reduced?.matches ? 0 : ms);
