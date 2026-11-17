# Design system: rules for working with it

This folder is a reusable, app-agnostic design system (Svelte 5 runes, plain JavaScript, Vite). Apps import it
through the `$ds` alias. `README.md` here is the catalogue: tokens, global classes, components and their props.
Read it before building UI, and read a component's header comment before using it.

## Using it (when working in an app)

- Look here first. Before writing a button, field, dropdown, menu, popover, tooltip, toggle, collapsible,
  empty state, toast or resizable panel, use the one in `components/` or the class in `css/atoms.css`.
- Import by path: `import Select from '$ds/components/inputs/Select.svelte'`, helpers from `$ds/lib/…`.
- Style with tokens only: colours, radii, spacing, durations, z-index and shadows all come from
  `css/tokens.css`. No hex or rgb values, pixel radii or millisecond durations in component styles, with
  one allowance: 1px hairlines and fine optical offsets.
- Hover, pressed and active states use the translucent fills (`--fill-2`, `--fill-3`, `--fill-4`), never
  an opaque colour. Resting surfaces are flat; only floating layers take `--shadow`.
- Text is 13px (12px for secondary and labels, 11px for counts), weights `--w-medium` and `--w-semibold`.
  Numbers, counts, dates and code use `--font-data` with `font-variant-numeric: tabular-nums`. Sentence
  case, no uppercase labels.
- Icons: `<Icon name="…" />` only. A new glyph is registered in the app (`registerIcons`, see the app's
  `src/lib/icons.js`), from Phosphor's regular weight.
- Floating things are portalled (`portal`, `portalNear`) and marked `data-floating`. Svelte transitions
  take `motion(ms)` so reduced motion is honoured.
- Every control has a label (visible, or `hideLabel` / `aria-label`), works from the keyboard, and has a
  pointer target of at least 24×24px. Anything on a context menu also has a visible `MoreButton`.
- Strict rule: every button whose meaning is not spelled out in visible text has a tooltip, with no
  exceptions. That covers icon-only buttons and links (`.icon-btn`, close and clear buttons) and terse
  toggles (a switch labelled "Live"). Use `{@attach tooltip('…')}` from `lib/tooltip.js`, alongside the
  `aria-label`. A native `title` is not a tooltip; do not use it for this.
- App-specific colours and atoms go in the app's own CSS, defined from these tokens (as the viewer does
  for verdicts and statuses in `src/global.css`). Do not add them here.

## Changing it

- Nothing here may import from an app (`src/…`), read app state, or mention the app's domain in names,
  defaults, copy or comments. State comes in through props and goes out through callbacks or `$bindable`.
  If a component needs app state, keep the generic part here and wrap it in the app
  (`src/components/Collapsible.svelte` wraps `components/Collapsible.svelte` this way).
- A new component belongs here only if another app could use it unchanged. Otherwise it goes in the app.
- Start each component with a comment block: what it is for, a usage example, each prop, keyboard
  behaviour. That comment is its documentation. Then add it to `index.js` and to the table in `README.md`.
- New tokens go in `css/tokens.css` with a comment, in the light block and in **both** dark blocks (the
  media query and `[data-theme="dark"]`), and in the README's token table. Check contrast (AA) in both themes.
- Renaming or removing a token, class, prop or export breaks every app using it: search the consumers
  (`grep -rn` in `src/`) and update them in the same change.
- Global CSS goes in the matching file (`base`, `effects`, `atoms`); component styles stay scoped in the
  `.svelte` file. Keep selectors low-specificity so apps can override them.
- Relative imports only inside this folder (`../lib/dom.js`), never `$ds/…`, so it also works when linked
  as a package.
- Dependencies: Svelte, Phosphor icons and the two fontsource packages. Do not add others without asking.

## Checking a change

There are no tests. Build the consuming app (`pnpm build` in the folder above) and look for new warnings,
then check the affected component in light and dark, with the keyboard, and at a width under 860px.
