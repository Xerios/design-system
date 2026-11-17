# Design system

A Linear-style design system for Svelte 5 apps: theme tokens (light and dark), a global CSS layer, and generic
components (inputs, menus, popovers, tooltips, collapsibles, toasts). Dense, quiet, keyboard-first.

Nothing in this folder knows about the app that uses it. It was extracted from the Jobhunt viewer, which now
consumes it through the `$ds` alias; anything job-specific (statuses, verdicts, scores) stays in the app.

Plain JavaScript, Svelte 5 runes, Vite. No build step of its own: the app's bundler compiles it.

## Use it in an app

**In this repo** it is already wired up: `vite.config.js` aliases `$ds` to this folder and `src/main.js` loads
the fonts and CSS.

**In another project**, copy or symlink this folder in, then:

1. Install what it needs: `pnpm add -D svelte @sveltejs/vite-plugin-svelte vite @phosphor-icons/core @fontsource-variable/inter @fontsource-variable/jetbrains-mono`
2. Alias it in `vite.config.js`:

   ```js
   import { fileURLToPath } from 'node:url';
   export default defineConfig({
     plugins: [svelte()],
     resolve: { alias: { $ds: fileURLToPath(new URL('./design-system', import.meta.url)) } },
   });
   ```

   If the folder sits outside the project root, also add it to `server.fs.allow`. (It has a `package.json`,
   so `"@local/design-system": "link:../design-system"` works too; then import from that name instead of `$ds`.)
3. Load the global layer once, in the entry file, before your own CSS:

   ```js
   import '$ds/fonts.js';        // Inter + JetBrains Mono, bundled (optional: see Fonts)
   import '$ds/css/index.css';   // tokens, base, effects, atoms
   import './app.css';           // yours, after
   ```
4. Mount the two singletons at the root if you use them: `<ContextMenu />` (any `contextMenu` attachment or
   `MoreButton`) and `<Toast … />`.
5. Import components by path, `import Select from '$ds/components/inputs/Select.svelte'`, or by name from the
   barrel, `import { Select, Icon } from '$ds'`.

For editors, `jsconfig.json` maps `$ds/*` to `design-system/*`.

## What's in the folder

```
css/index.css        imports the four files below, in order
css/tokens.css       every token, light and dark
css/base.css         reset, body type, selection rules, scrollbars, links, focus rings, kbd, utilities
css/effects.css      scroll fades, lit edge, corner glow, shine, shimmer, dialog motion
css/atoms.css        .btn, .icon-btn, .data-table, .count, tones, .label-chip, .field-label, .new-dot
components/          generic components (table below)
components/inputs/   form controls
components/menu/     the context menu layer
lib/                 dom.js, motion.js, scroll-fade.js, menu.svelte.js, inline-md.js
fonts.js             bundles the two typefaces
index.js             named exports of everything
```

## Theme

Light by default, dark when the OS asks for it. `<html data-theme="light">` or `data-theme="dark"` overrides
the OS. To avoid a flash, set the attribute from a small inline script in `index.html` before the page paints
(the viewer's `index.html` shows how). `tokens.css` has the dark values twice, once for the media query and
once for the attribute: change both.

## Tokens

All in `css/tokens.css`. Components read tokens only, never raw colours or pixel radii.

| Group | Tokens |
|---|---|
| Surfaces, back to front | `--bg` (app frame), `--view-bg` (inset view card), `--surface`, `--surface-2`, `--surface-3`, `--elevated` (floating layers) |
| Text | `--fg` primary, `--fg-2` secondary, `--muted` tertiary, `--faint` quaternary |
| Hairlines | `--line`, `--line-strong`, `--line-float` (menus, popovers, dialogs), `--hairline` (1px, 0.5px on dense screens) |
| Fills (translucent, stack on any surface) | `--fill-1` resting, `--fill-2` hover, `--fill-3` pressed or raised, `--fill-4` active |
| Accent | `--accent` (text, focus, ticks), `--brand` (solid fills), `--accent-ink`, `--accent-soft`, `--accent-line` |
| Semantic tones | `--success`, `--info`, `--warning`, `--neutral`, `--danger`, each with a `-soft` fill |
| Elevation | `--shadow-sm`, `--shadow-md`, `--shadow-btn`, `--shadow` (floating), `--ring` (focus), `--glass`, `--scrim` |
| Edges and light | `--edge-hi`, `--edge-r`, `--edge-plateau`, `--edge-grad`, `--edge-grad-float`, `--edge-shadow`, `--shine`, `--glow`, `--grain`, `--relief-texture`, `--relief-shade` |
| Type | `--font-body`, `--font-display`, `--font-data` (= `--font-mono`), weights `--w-normal` 400, `--w-medium` 510, `--w-semibold` 590. Body is 13px/1.5 |
| Spacing (4px base) | `--space-1` 4 · `-2` 8 · `-3` 12 · `-4` 16 · `-5` 20 · `-6` 24 · `-8` 32 |
| Radii | `--r-sm` 6 (chips, keys) · `--r` 8 (rows, fields) · `--r-lg` 10 (cards, popovers) · `--r-xl` 12 (panels, dialogs) · `--r-pill` |
| Motion | `--dur-fast` 120ms, `--dur` 160ms, `--dur-slow` 240ms, `--ease-out`, `--ease-in` |
| Layers, low to high | `--z-sticky`, `--z-header`, `--z-drawer`, `--z-toast`, `--z-menu`, `--z-overlay` |
| Icons | `--icon-sm` 14, `--icon-md` 16, `--icon-lg` 20 |
| Layout | `--gutter-l`, `--gutter-r` (16px or the safe-area inset) |

Tokens an app may set: `--toast-offset` (how far toasts sit above the bottom edge), `--bleed` (on a container
of `Collapsible`s: its side padding), `--scroll-fade` (fade height on a scroll area).

**App-specific colours** belong in the app's CSS, built on these. The viewer names its verdicts this way:

```css
:root { --strong: var(--success); --strong-soft: var(--success-soft); }
[data-tone="strong"] { --tone: var(--strong); --tone-soft: var(--strong-soft); }
```

## Global classes

| Class / attribute | What it is |
|---|---|
| `.btn`, `.btn-primary`, `.btn-small` | Pill button: translucent secondary, solid indigo primary, 24px small |
| `.icon-btn` | 28px ghost circle for an icon; `aria-pressed` and `aria-expanded` are styled |
| `.linklike` | A button that reads as a link |
| `kbd` | Key cap |
| `.data-table` | Wrap a `<table>`: hairline card, 40px rows; `.num` for number columns |
| `.label-chip`, `.label-dot` | Hairline label pill led by a coloured dot (`--dot`) or icon; `.icon-only`, `.num` variants |
| `.count` | Small number pill |
| `.eyebrow`, `.field-label` | Section label; label above a form control |
| `.new-dot` | Accent dot for unread or new |
| `[data-tone="success\|info\|warning\|neutral\|danger"]` | Sets `--tone` and `--tone-soft` on the element |
| `.edge` | Lit-corner hairline drawn over the element's edge (give it `border: 0`); tune with `--edge-a`, `--edge-b`, `--edge-w`, `--edge-x`, `--edge-y` |
| `.corner-glow`, `.shine` | Empty decorative `<span aria-hidden="true">` children: soft corner light; a beam on the edge |
| `.shimmer` | Working sweep along a pill's hairline (pair with a `Shimmer` label) |
| `.skip-link` | First focusable element on the page |
| `.sr-only`, `.muted`, `.small`, `.block`, `.nowrap`, `.spacer` | Utilities |
| `[data-layer-root]` | Mark the app shell so popover scrims stack inside it (see `portalNear`) |
| `[data-floating]` | Put on a layer portalled to `<body>` so an open `Popover` doesn't treat clicks in it as outside |

Every `<dialog>` opened with `showModal()` gets the rise-and-fade motion. Scroll containers that float (menus,
popovers) can't host `.edge`; they paint it as background layers, as described in `css/effects.css`.

## Components

Each file starts with a comment giving its props and behaviour; that comment is the reference. In short:

| Component | Use it for | Main props |
|---|---|---|
| `Icon` | Any icon (Phosphor regular) | `name`, `size` sm/md/lg, `label` (only if it carries meaning) |
| `Empty` | Empty state | `title`, `body`, children for actions |
| `Notice` | Inline notice about a standing condition | `tone`, `icon`, children for the text |
| `Shimmer` | "Working…" text | `text` or children, `active`, `as` |
| `WorkingBorder` | Comets circling a card that's busy | none; set `--radius` |
| `Collapsible` | Section in a panel | `title`, `open` (bindable), `ontoggle`, `count`, `meta` |
| `CollapsibleAdvanced` | Collapsible card with status | `title`, `open`, `variant`, `dimmed`, `expandable`, `loading`, snippets `lead` `meta` `end` `actions` |
| `Splitter` | Resizing a panel | `value`, `min`, `max`, `defaultValue`, `side`, `oninput`, `onchange` |
| `Popover` | Button that opens a panel | `id`, `label`, `trigger` snippet, `badge`, `dot`, `align`, `placement`, `width`, `scrim`, `open` (bindable) |
| `Tooltip` | Hover or focus tip around content | `tip` snippet, `focusable` |
| `InfoTip` | ⓘ button with label/text lines | `lines`, `label`, `pinnable` |
| `Md` | Inline markdown, no `{@html}` | `text` |
| `MoreButton` | Visible ⋯ twin of a context menu | `items` (function), `label` |
| `Toast` | The one toast (app owns the state) | `toast`, `onhold`, `ondismiss` |
| `inputs/TextField`, `SearchField`, `TextArea` | Text entry | `value` (bindable), `id`, `label`, `hideLabel`, `placeholder`, `shortcut`, `onenter`; `focus()` |
| `inputs/Select` | Dropdown | `value` (bindable), `options`, `id`, `label`, `groupActions`, `loading` |
| `inputs/Segmented`, `ButtonGroup` | One choice of a few | `value`, `options`, `label`, `onchange`, `iconOnly`; ButtonGroup: `fill`, `pill` |
| `inputs/Switch` | On/off | `checked` (bindable), `id`, `label`, `hint` |
| `inputs/Slider` | Number in a range | `value` (bindable), `min`, `max`, `step`, `id`, `label`, `format` |
| `inputs/FileButton` | File picker | `label`, `accept`, `multiple`, `onfiles` |
| `menu/ContextMenu` | The menu layer; mount once | none |

Option shape for `Select`, `Segmented` and `ButtonGroup`: `{ value, label, icon?, hint? }`, plus `text` and
`group` for `Select`, `done` for `Segmented`, `info` for `ButtonGroup`.

### Icons

`Icon` ships about forty general-purpose glyphs (carets, check, x, search, more, undo, eye, gear, sun, moon…;
`iconNames()` lists them). An app registers the rest once, before it mounts:

```js
import { registerIcons } from '$ds/components/Icon.svelte';
import trophy from '@phosphor-icons/core/regular/trophy.svg?raw';
registerIcons({ trophy });
```

One family, regular weight. The `?raw` import is Vite's.

### Context menus

```svelte
<ContextMenu />   <!-- once, at the root -->

<li {@attach contextMenu(() => rowMenu(row), 'Row actions')}>
  …
  <MoreButton items={() => rowMenu(row)} label={row.name} />
</li>
```

Items: `{ label, action?, href?, hint?, checked?, disabled?, danger?, children? }` or `{ separator: true }`.
Right-click, Shift+F10 and the Menu key open it; text fields keep the browser's menu. Always pair a context
menu with a `MoreButton`, so nothing is reachable by right-click only.

### Toast

```js
// app state
let timer;
export function toast(message, action = null, ms = 5000) { app.toast = { id: Date.now(), message, action, ms }; hold(false); }
export function hold(on) { clearTimeout(timer); if (!on && app.toast) timer = setTimeout(() => (app.toast = null), app.toast.ms); }
```

```svelte
<Toast toast={app.toast} onhold={hold} ondismiss={() => (app.toast = null)} />
```

## Helpers (`lib/`)

| Export | What it does |
|---|---|
| `portal`, `portalNear(from)` | Attachments that move a node to `<body>` or the nearest `[data-layer-root]` |
| `backdropClose(close)` | Handlers to spread on a `<dialog>`: closes on a true backdrop click only |
| `motion(ms)` | Duration for Svelte transitions; 0 under reduced motion |
| `scrollFade({ size? })` | Attachment: fades a scroll area's top and bottom edges while there is more to scroll |
| `contextMenu`, `menu`, `openMenu`, `openMenuFrom`, `closeMenu` | Context menu state and attachment |
| `inlineMd(text)` | Parses inline markdown into parts (what `Md` renders) |

## Fonts

`fonts.js` bundles Inter and JetBrains Mono (variable), so nothing loads from the network. To use other faces,
skip the import and set `--font-body`, `--font-display` and `--font-data` in your CSS; the weights 510 and 590
assume a variable font.

## Conventions the system relies on

- Breakpoint: one, at 860px. Below it `Splitter` hides, popovers span the width and fields grow to 16px text.
- Reduced motion: CSS animation and transitions switch off globally; Svelte transitions go through `motion()`.
- Accessibility: every text and background pair meets WCAG AA in both themes; pointer targets are at least
  24×24px; focus rings come from `:focus-visible` in `base.css`.
- Browser support: current Chromium, Firefox and Safari (`color-mix()`, `@property`, `@starting-style`,
  `offset-path`, Svelte 5.29+ for `{@attach}`).

## Adding to it

See `CLAUDE.md` in this folder for the rules (they apply to people as well). The test for whether something
belongs here: could a different app use it without changing it?
