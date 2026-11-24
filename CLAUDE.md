# Design system: rules for working with it

This folder is a reusable, app-agnostic design system (Svelte 5 runes, plain JavaScript), published to npm as
`@xerios/design-system`. Apps import it by that name. `README.md` here is the catalogue: tokens, global classes,
components and their props. Read it before building UI, and read a component's header comment before using it.

The library source lives in `src/`; `pnpm build` (svelte-package) copies it to `dist/` with `.d.ts` files generated
from the JSDoc, and the package exports map there. Paths in this file (`components/`, `css/tokens.css`, `lib/…`,
`index.js`) are relative to `src/`; import paths leave it out (`@xerios/design-system/components/…`).
The kitchen sink is a separate, private app in `kitchensink/` at the repo root (not published); `pnpm dev` runs it.

## Using it (when working in an app)

- Look here first. Before writing a button (`Button`: icons, async actions with their pending and error states), field, dropdown, menu, popover, tooltip, toggle, collapsible,
  empty state, toast, modal dialog or resizable panel, use the one in `components/` or the class in `css/atoms.css`.
  A modal is `<Modal>`, not a hand-built `<dialog class="dialog">`; a plain question is `confirmDialog`. A field's
  error state is the `invalid` attachment (lib/invalid.js), never aria-invalid / aria-describedby written by hand.
- Compose instead of copying: pass content as children and snippets, and add a class, attributes or an attachment
  straight on the component (`<Empty class="…" {@attach …}>`); they reach its main element.
- Import by path: `import Select from '@xerios/design-system/components/inputs/Select.svelte'`, helpers from
  `@xerios/design-system/lib/…`, or by name from the package root.
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
- A button beside a field lines up with the field's control, not with the field and its label: put them in a
  `.field-row` (never a hand-made flex row with `align-items: center` or `end`). There a `.btn` is as tall as the
  control (`--control-h`), and a ghost `.icon-btn` (or `.btn-small`, `.chip-btn`) keeps its size, centred on the
  control. The same goes for any field: a `Select`, `TextField`, `DatePicker` or `TagInput` with an action beside it.
  For compact fields set `--control-h: 28px` on the row; a new field component sizes its control line from
  `--control-h`, never a fixed 32px.
- A description of a list's option (what it means, before it is chosen) is its `detail`, shown in a `SideTip` beside
  the list while the option is under the pointer or the keyboard (`Select`, `OptionList`), not a second line in the row
  or a `title`. Rich content goes through the `detail` snippet. A list of your own uses `SideTip` the same way.
- Controls (anything you press, type into or drag) take the tinted control fills (`--control-1` … `--control-4`) at
  rest and for hover, pressed and active; non-interactive things use the neutral `--fill-*`. Both are translucent, never
  an opaque colour. Resting surfaces are flat; only floating layers take `--shadow`.
- Interactive text is clear at rest and keeps its colour. A button's, row's, option's or tab's text is `--fg` (`--fg-2`
  only where something brighter beside it must stand out, such as the current page after breadcrumb links), and hover,
  pressed, open, chosen and keyboard-highlighted states change the fill, border or raise, never the text colour: a
  brightness step on text the fill already marks is barely seen, but it redraws the glyphs, which reads as a shift.
  Icons may brighten (no text to redraw). A colour change is the indicator only where nothing else changes (a link, a
  sort header). Muted text is for things you don't press, with two exceptions: the options of a one-of-many choice
  (`Segmented`, `ButtonGroup`, `RadioGroup`) are `--muted` until hovered, and the chosen one is `--fg`; and an open
  section's header title (`Collapsible`, a `Table` group) steps back to `--muted` so the content under it leads.
- Suggestions are dashed. Anything proposed but not applied yet (a suggested label, assignee, reply or next step) is a
  `.label-chip`, `.chip-btn` or `.btn` (`<Button class="suggested">`) with `.suggested`: a dashed outline and no fill in
  its resting state, turning solid as a button is hovered or pressed (a suggested button's text is as clear as any
  button's; only a suggested label's is muted). Keep dashed outlines for this: no other control is dashed at
  rest (drop zones, which say where files go, aside).
- A chosen span is one block (Linear's timeline bars). A range picked out of a list or grid (days, rows, steps) reads
  as one rounded shape: its two ends solid `--brand`, rounded only on their outer side; the items between square, under
  a brand tint that blends out of each end (strongest beside it, easing off in the middle) as one continuous gradient,
  never a flat fill per item. Where it wraps (a calendar's weeks) it is one bar per line, rounded only where each bar
  starts and ends. While its second end is still being chosen it is a proposal: only the fixed end is solid, and the rest
  is a tint fading in from it towards the pointer inside a `DashOutline` (Linear's spaced dashes, open on the solid
  side). The row under the pointer still lights up on top of the tint. `Calendar` (one bar per week) and
  `DateRangeSelect` (one band behind its rows) draw it; follow them for a new one.
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
  of it to the kitchen sink area it belongs to (`kitchensink/src/` at the repo root): one `Demo` per component, each of its states in a
  captioned `Case` inside it. Areas run
  from what you interact with (Actions, Inputs, Overlays), through what shows content and state (Content, Feedback),
  to Atoms and Foundations last; within an area, interactive demos come before view-only ones.
- Type the props with a JSDoc `Props` typedef on `$props()`, intersected with the main element's attributes from
  `svelte/elements` (`Props & Omit<HTMLAttributes<HTMLDivElement>, keyof Props>`). Take `class: className` and
  `...rest`, and put `class={['own-class', className]} {...rest}` on that element, before the component's own event
  handlers, so a consumer's class adds to it and their attachments arrive. Snippets for the parts a consumer fills in.
- Svelte 5 practice: `$derived` (writable when a value resets) over `$effect` that sets state; DOM work in
  `{@attach}`; page-wide listeners in `<svelte:document>` / `<svelte:window>`; ids from `$props.id()`.
- Cut text off with `overflow: clip` (with `text-overflow: ellipsis` and `white-space: nowrap`), not `overflow: hidden`,
  which also makes the element a scroll container (scrollable from script). Keep `hidden`/`auto` for boxes that really
  scroll.
- Hover rules restyle only what the hover is about. No global `*:hover` / `:hover` on broad selectors: every element
  the pointer passes over then restyles and repaints, and its text can redraw a pixel off, as if it jumped.
- Chrome can't be selected: a component's own chrome (anything you press, drag or read as a label: buttons, chips,
  pills, segments, list rows, headings of lists, menus, toolbars, calendars) takes `user-select: none`. `base.css`
  covers the common roles and atoms; a component built from plain `<span>`s and `<div>`s sets it in its own styles,
  on its root. Content stays selectable (values worth copying, messages, prose; `user-select: text` on such a part
  inside chrome). Never set it on an ancestor of a text field: Safari then won't let you type in it, so put it on the
  field's siblings instead.
- New tokens go in `css/tokens.css` with a comment, in the `:root` block as `light-dark(light, dark)` when they
  differ by theme (shadows: one `light-dark()` per layer colour, `transparent` for a layer one theme lacks), and
  in the README's token table. A non-colour value that differs needs its dark value twice below the
  block: in `[data-theme="dark"]` and in a `@media (prefers-color-scheme: dark)` rule on `:root:not([data-theme="light"])`. Check contrast (AA) in both themes.
- Renaming or removing a token, class, prop or export breaks every app using it: it needs a major version bump
  (minor while on 0.x), a **Breaking** entry in `CHANGELOG.md` saying what an app must change, and the kitchen sink
  updated in the same change.
- Every change an app could notice (a new component, prop, token or class; a changed look or behaviour; a fix) gets a
  line in `CHANGELOG.md` under `## [Unreleased]`, in the same change, under `Added`, `Changed`, `Deprecated`, `Removed`
  or `Fixed`. Name the component, class or token first and say what an app sees, not how it was done. Internal work
  (kitchen sink, scripts, refactors with no visible effect) stays out.
- Releasing: `pnpm release [patch|minor|major|x.y.z]` (scripts/release.js) bumps `version` in `package.json`, renames
  `[Unreleased]` in `CHANGELOG.md` to `[x.y.z] - YYYY-MM-DD` under a fresh empty `[Unreleased]`, updates the compare
  links at the bottom, checks the builds, and commits and tags `vx.y.z`. Do it by hand only if the script can't.
- Global CSS goes in the matching file (`base`, `effects`, `atoms`); component styles stay scoped in the
  `.svelte` file. Keep selectors low-specificity so apps can override them.
- Relative imports only inside `src/` (`../lib/dom.js`), never the package name, so the built `dist/` stays
  self-contained. The kitchen sink is the opposite: it imports the library only by package name, as an app would.
- No bundler-specific imports in `src/` (no Vite `?raw`, `?url`, `import.meta.glob`): the package must work in any
  bundler. The built-in icons are inlined in `components/icons.js`, generated by `scripts/icons.js` (`pnpm icons`).
- Dependencies: Svelte (peer), the two fontsource packages, any-date-parser (reading typed dates, `lib/dates.js`), and
  Phosphor icons (dev only, for `pnpm icons`).
  Do not add others without asking. Only `dist/` and `CHANGELOG.md` are published (`files` in `package.json`).

## Checking a change

There are no tests. Run `pnpm build` (svelte-package, then publint) and `pnpm build:kitchensink`, and look for new
warnings. Then check the affected component in the kitchen sink (`pnpm dev`; it resolves the package name to `src/`,
so edits hot-reload) in light and dark (the theme switch in its sidebar), with the keyboard, and at a width under 860px.
