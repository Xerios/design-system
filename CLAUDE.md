# Design system: rules for working with it

This folder is a reusable, app-agnostic design system (Svelte 5 runes, plain JavaScript, Vite). Apps import it
through the `$ds` alias. `README.md` here is the catalogue: tokens, global classes, components and their props.
Read it before building UI, and read a component's header comment before using it.

## Using it (when working in an app)

- Look here first. Before writing a button (`Button`: icons, async actions with their pending and error states), field, dropdown, menu, popover, tooltip, toggle, collapsible,
  empty state, toast, modal dialog or resizable panel, use the one in `components/` or the class in `css/atoms.css`.
  A modal is `<Modal>`, not a hand-built `<dialog class="dialog">`; a plain question is `confirmDialog`. A field's
  error state is the `invalid` attachment (lib/invalid.js), never aria-invalid / aria-describedby written by hand.
- Compose instead of copying: pass content as children and snippets, and add a class, attributes or an attachment
  straight on the component (`<Empty class="…" {@attach …}>`); they reach its main element.
- Import by path: `import Select from '$ds/components/inputs/Select.svelte'`, helpers from `$ds/lib/…`.
- Style with tokens only: colours, radii, spacing, durations, z-index and shadows all come from
  `css/tokens.css`. No hex or rgb values, pixel radii or millisecond durations in component styles, with
  one allowance: 1px hairlines and fine optical offsets.
- Separators run edge to edge by default: a horizontal or vertical rule dividing a container's areas reaches its
  borders, not its padding. Pull the divided part out through the padding with a negative margin and pad it back
  (`margin-inline: calc(var(--page-inset) * -1); padding-inline: var(--page-inset)`), or put the padding on the parts
  instead of the container. Inset a rule only when it belongs to one item rather than dividing the whole (rows in a list).
- An icon beside text that can wrap aligns to the top, with the first line, never to the middle of the block: give the
  icon a box one line tall (`height: 1lh`) and `align-items: flex-start` on the row. The same goes for a trailing
  button (dismiss, clear) beside wrapping text.
- Hover, pressed and active states use the translucent fills (`--fill-2`, `--fill-3`, `--fill-4`), never
  an opaque colour. Resting surfaces are flat; only floating layers take `--shadow`.
- Text is 13px (12px for secondary and labels, 11px for counts), in px, as are the breakpoints. A box holding text gets
  `min-height`, not `height`. Weights `--w-medium` and `--w-semibold`.
  Numbers, counts, dates and code use `--font-data` with `font-variant-numeric: tabular-nums`. Sentence
  case, no uppercase labels.
- Icons: `<Icon name="…" />` only. A new glyph is registered in the app (`registerIcons`, see the app's
  `src/lib/icons.js`), from Phosphor's regular weight.
- Floating things are portalled (`portal`, `portalNear`) and marked `data-floating`. Anything that can open from
  inside a modal dialog (tips, lists, menus) uses `topLayer` instead, or the dialog draws over it. Svelte transitions
  and animations come from `lib/motion.js` (`fade`, `fly`, `slide`, `scale`, `pop`, `flip`, `tween`), which follow Material 3's
  motion rules and honour reduced motion; a custom one uses its `durations`, `easings` and `motion(ms)`.
- Every control has a label (visible, or `hideLabel` / `aria-label`), works from the keyboard, and has a
  pointer target of at least 24×24px. Anything on a context menu also has a visible `MenuButton`.
- Strict rule: every button whose meaning is not spelled out in visible text has a tooltip, with no
  exceptions. That covers icon-only buttons and links (`.icon-btn`, close and clear buttons) and terse
  toggles (a switch labelled "Live"). Use `{@attach tooltip('…')}` from `lib/tooltip.js`, alongside the
  `aria-label`. A native `title` is not a tooltip; do not use it for this.
- Descriptions and help text (what a field or section is for, what a value means, how to fill it in) go behind
  an `InfoTip` next to the label, never in a paragraph under the control. Pass `info` to `TextField`,
  `TextArea`, `Select` or `Collapsible`; anywhere else put `<InfoTip>` after the label (in a `.field-head`
  row for a field). Its tip opens on hover and keyboard focus. Make it `pinnable` (a click toggles it open)
  when its text is worth selecting or it holds links or actions, so they can be reached. Keep visible:
  errors, warnings, what a destructive action will do, status, empty states, and anything needed to act safely.
- App-specific colours and atoms go in the app's own CSS, defined from these tokens (as the viewer does
  for verdicts and statuses in `src/global.css`). Do not add them here.

## Changing it

- Nothing here may import from an app (`src/…`), read app state, or mention the app's domain in names,
  defaults, copy or comments. State comes in through props and goes out through callbacks or `$bindable`.
  If a component needs app state, keep the generic part here and wrap it in the app
  (`src/components/Collapsible.svelte` wraps `components/Collapsible.svelte` this way).
- A new component belongs here only if another app could use it unchanged. Otherwise it goes in the app.
- Start each component with a comment block: what it is for, a usage example, each prop, keyboard
  behaviour. That comment is its documentation. Then add it to `index.js`, to the table in `README.md`, and a `Demo`
  of it to the kitchen sink area it belongs to (`kitchensink/`): one `Demo` per component, each of its states in a
  captioned `Case` inside it. Areas run
  from what you interact with (Actions, Inputs, Overlays), through what shows content and state (Content, Feedback),
  to Atoms and Foundations last; within an area, interactive demos come before view-only ones.
- Type the props with a JSDoc `Props` typedef on `$props()`, intersected with the main element's attributes from
  `svelte/elements` (`Props & Omit<HTMLAttributes<HTMLDivElement>, keyof Props>`). Take `class: className` and
  `...rest`, and put `class={['own-class', className]} {...rest}` on that element, before the component's own event
  handlers, so a consumer's class adds to it and their attachments arrive. Snippets for the parts a consumer fills in.
- Svelte 5 practice: `$derived` (writable when a value resets) over `$effect` that sets state; DOM work in
  `{@attach}`; page-wide listeners in `<svelte:document>` / `<svelte:window>`; ids from `$props.id()`.
- New tokens go in `css/tokens.css` with a comment, in the `:root` block as `light-dark(light, dark)` when they
  differ by theme (shadows: one `light-dark()` per layer colour, `transparent` for a layer one theme lacks), and
  in the README's token table. A non-colour value that differs needs its dark value twice below the
  block: in `[data-theme="dark"]` and in a `@media (prefers-color-scheme: dark)` rule on `:root:not([data-theme="light"])`. Check contrast (AA) in both themes.
- Renaming or removing a token, class, prop or export breaks every app using it: search the consumers
  (`grep -rn` in `src/`) and update them in the same change.
- Global CSS goes in the matching file (`base`, `effects`, `atoms`); component styles stay scoped in the
  `.svelte` file. Keep selectors low-specificity so apps can override them.
- Relative imports only inside this folder (`../lib/dom.js`), never `$ds/…`, so it also works when linked
  as a package.
- Dependencies: Svelte, Phosphor icons and the two fontsource packages. Do not add others without asking.

## Checking a change

There are no tests. Build the consuming app (`pnpm build` in the folder above) and look for new warnings,
then check the affected component on the kitchen sink (`kitchensink/KitchenSink.svelte`; this app serves it at
`/kitchensink`, linked in development) in light and dark, with the keyboard, and at a width under 860px.
