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
   import { fileURLToPath } from 'node:url'
   export default defineConfig({
     plugins: [svelte()],
     resolve: { alias: { $ds: fileURLToPath(new URL('./design-system', import.meta.url)) } },
   })
   ```

   If the folder sits outside the project root, also add it to `server.fs.allow`. (It has a `package.json`,
   so `"@local/design-system": "link:../design-system"` works too; then import from that name instead of `$ds`.)

3. Load the global layer once, in the entry file, before your own CSS:

   ```js
   import '$ds/fonts.js' // Inter + JetBrains Mono, bundled (optional: see Fonts)
   import '$ds/css/index.css' // tokens, base, effects, atoms
   import './app.css' // yours, after
   ```

4. Mount the singletons at the root: `<ContextMenu />` (any `contextMenu` attachment or `MenuButton`; it also keeps
   the browser's drag and right-click menu off controls, see `lib/controls.js`), and if you use them `<Dialogs />` (`alertDialog`, `confirmDialog`, `promptDialog`) and `<Toast … />`.
5. Import components by path, `import Select from '$ds/components/inputs/Select.svelte'`, or by name from the
   barrel, `import { Select, Icon } from '$ds'`.

For editors, `jsconfig.json` maps `$ds/*` to `design-system/*`.

## What's in the folder

```
css/index.css        imports the four files below, in order
css/tokens.css       every token, light and dark
css/base.css         reset, body type, selection rules, scrollbars, links, focus rings, kbd, utilities
css/effects.css      scroll fades, lit edge, corner glow, shine, shell atmosphere, shimmer, spotlight, dialog motion
css/atoms.css        .btn, .icon-btn, .data-table, .count, tones, .label-chip, .chip-btn, .field-label, .new-dot, .prose
components/          generic components (table below)
components/inputs/   form controls
components/menu/     the context menu layer
components/tiles/    tiles and the tile group
components/metadata/ labelled values (Metadata, Metadata.Row)
lib/                 dom.js, dialogs.svelte.js, motion.js, scroll-fade.js, validity.js, tooltip.js, field-errors.svelte.js, menu.svelte.js, controls.js, inline-md.js, spotlight.js
fonts.js             bundles the two typefaces
index.js             named exports of everything
```

## Theme

Light by default, dark when the OS asks for it. `<html data-theme="light">` or `data-theme="dark"` overrides
the OS. To avoid a flash, set the attribute from a small inline script in `index.html` before the page paints
(the viewer's `index.html` shows how). Each colour token is one `light-dark(light, dark)` pair, and the theme
only sets `color-scheme`. A non-colour value that differs by theme can't use `light-dark()`; it would be set per theme.

## Tokens

All in `css/tokens.css`. Components read tokens only, never raw colours or pixel radii.

| Group                                     | Tokens                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surfaces, back to front                   | `--bg` (app frame), `--view-bg` (inset view card), `--surface`, `--surface-2`, `--surface-3`, `--elevated` (floating layers)                                                                                                                                                                                                                                                                                                                       |
| Text                                      | `--fg` primary, `--fg-2` secondary, `--muted` tertiary, `--faint` quaternary                                                                                                                                                                                                                                                                                                                                                                       |
| Hairlines                                 | `--line`, `--line-strong`, `--line-float` (menus, popovers, dialogs)                                                                                                                                                                                                                                                                                                                                                                               |
| Fills (translucent, stack on any surface) | `--fill-1` resting, `--fill-2` hover, `--fill-3` pressed or raised, `--fill-4` active                                                                                                                                                                                                                                                                                                                                                              |
| Control fills (tinted, translucent) | `--control-1` … `--control-4`: the fill scale with a faint brand-hue cast (`--control-hue`), for anything you press, type into or drag, so controls read apart from neutral surfaces |
| Accent                                    | `--accent` (text, focus, ticks), `--brand` (solid fills), `--accent-ink`, `--accent-soft`, `--accent-line`                                                                                                                                                                                                                                                                                                                                         |
| Semantic tones                            | `--success`, `--info`, `--warning`, `--neutral`, `--danger`, each with a `-soft` fill                                                                                                                                                                                                                                                                                                                                                              |
| Elevation                                 | `--shadow-sm`, `--shadow-md`, `--shadow-btn` (raised controls: buttons, select triggers, chosen segments), `--shadow` (floating), `--ring` (focus), `--glass`, `--scrim`                                                                                                                                                                                                                                                                           |
| Edges and light                           | `--edge-hi`, `--edge-r`, `--edge-plateau`, `--edge-grad`, `--edge-grad-float`, `--edge-shadow`, `--shine`, `--glow`, `--grain`, `--raised-edge`, `--raised-base`, `--sunken-shadow`, `--relief-texture`, `--relief-shade`, `--solid-edge` and `--solid-line` (on solid buttons), `--knob`, `--knob-shadow` and `--knob-ring` (Switch and Slider thumbs)                                                                                            |
| Type                                      | `--font-body`, `--font-display`, `--font-data` (= `--font-mono`), weights `--w-normal` 400, `--w-medium` 510, `--w-semibold` 590. Body is 13px/1.5                                                                                                                                                                                                                                                                                                 |
| Spacing (4px base)                        | `--space-1` 4 · `-2` 8 · `-3` 12 · `-4` 16 · `-5` 20 · `-6` 24 · `-8` 32                                                                                                                                                                                                                                                                                                                                                                           |
| Radii                                     | `--r-sm` 6 (chips, keys) · `--r` 8 (rows, fields) · `--r-lg` 10 (cards, popovers) · `--r-xl` 12 (panels, dialogs) · `--r-pill`                                                                                                                                                                                                                                                                                                                     |
| Motion                                    | `--dur-fast` 120ms, `--dur` 160ms, `--dur-slow` 240ms, `--ease-out`, `--ease-in`, `--ease-enter` with `--dur-enter` 180ms and `--ease-exit` with `--dur-exit` 200ms (Material 3 standard decelerate/accelerate, used by modals), `--ease-spring` with `--dur-spring` 400ms (a dialog's bounce in) and `--ease-dip` with `--dur-dip` 240ms (its drop and lift away), `--delay-intent` 300ms (how long the pointer rests before something lights up) |
| Layers, low to high                       | `--z-sticky`, `--z-header`, `--z-drawer`, `--z-toast`, `--z-menu`, `--z-overlay`                                                                                                                                                                                                                                                                                                                                                                   |
| Icons                                     | `--icon-sm` 14, `--icon-md` 16, `--icon-lg` 20                                                                                                                                                                                                                                                                                                                                                                                                     |
| Layout                                    | `--gutter-l`, `--gutter-r` (16px or the safe-area inset)                                                                                                                                                                                                                                                                                                                                                                                           |

Tokens an app may set: `--toast-offset` (how far toasts sit above the bottom edge), `--bleed` (on a container
of `Collapsible`s: its side padding), `--scroll-fade` (fade height on a scroll area), `--page-inset` (on a page's
scroll area: its side padding, so separators inside run through it to the edges).

**App-specific colours** belong in the app's CSS, built on these. The viewer names its verdicts this way:

```css
:root {
  --strong: var(--success);
  --strong-soft: var(--success-soft);
}
[data-tone='strong'] {
  --tone: var(--strong);
  --tone-soft: var(--strong-soft);
}
```

## Global classes

| Class / attribute                                                            | What it is                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.btn`, `.btn-primary`, `.btn-small`, `.btn-danger`                          | Pill button: translucent secondary, solid indigo primary, 24px small, solid red for a destructive action                                                                                                                                                                                                                                                               |
| `.dialog`, `.dialog.confirm`, `.dialog-head`, `.dialog-body`, `.dialog-foot` | Modal `<dialog>` panel (560px; 420px for a question) with a header, scrolling body and footer of actions, lit with the shine and corner glow (its `::before` and `::after`); `--dialog-width` sets another width. `Modal` draws the panel and header for you                                                                                                           |
| `.icon-btn`                                                                  | 28px ghost circle for an icon; `aria-pressed` and `aria-expanded` are styled                                                                                                                                                                                                                                                                                           |
| `.linklike`                                                                  | A button that reads as a link                                                                                                                                                                                                                                                                                                                                          |
| `kbd`                                                                        | Key cap                                                                                                                                                                                                                                                                                                                                                                |
| `.data-table`                                                                | Wrap a `<table>`: hairline card, 40px rows; `.num` for number columns. For sorting, groups or row menus use the `Table` component                                                                                                                                                                                                                                      |
| `.label-chip`, `.label-dot`                                                  | Hairline label pill led by a coloured dot (`--dot`) or icon; `.icon-only`, `.num` variants                                                                                                                                                                                                                                                                             |
| `.chip-btn`, `.chip-btn.outlined`                                            | Interactive pill (Linear's property pills) on a `<button>` or `<a>`: borderless and transparent until hovered, secondary text led by an icon or `.label-dot`; `.outlined` adds the hairline. The clickable counterpart of `.label-chip`                                                                                                                                |
| `.count`                                                                     | Small number pill                                                                                                                                                                                                                                                                                                                                                      |
| `.field-box`                                                                 | The box a text field draws: sunken (faint fill, inset hairline, shadow inside the top and left edges), focus and invalid states                                                                                                                                                                                                                                        |
| `.eyebrow`, `.field-label`, `.field-head`                                    | Section label; label above a form control; a label row with an `InfoTip` after it                                                                                                                                                                                                                                                                                      |
| `.prose`                                                                     | Long-form text (docs, notes, rendered markdown): styles the plain elements inside it, headings h1–h6, links, inline code, `kbd`, `mark`, `abbr`, `del` / `ins`, `sub` / `sup`, lists (nested and `dl`), quotes, code blocks, rules, figures and tables. Space goes above each block, none on the first. Pair with `AnchorHeading` for headings that link to themselves |
| `.new-dot`                                                                   | Accent dot for unread or new                                                                                                                                                                                                                                                                                                                                           |
| `[data-tone="success\|info\|warning\|neutral\|danger"]`                      | Sets `--tone` and `--tone-soft` on the element                                                                                                                                                                                                                                                                                                                         |
| `.edge`                                                                      | Lit-corner hairline drawn over the element's edge (give it `border: 0`); tune with `--edge-a`, `--edge-b`, `--edge-w`, `--edge-x`, `--edge-y`                                                                                                                                                                                                                          |
| `.corner-glow`                                                               | Empty decorative `<span aria-hidden="true">` child: soft corner light                                                                                                                                                                                                                                                                                                  |
| `.shine`                                                                     | A beam of light on the element's edge, drawn on `::after`; tune with `--shine-x`, `--shine-y`, `--edge-w`; set `--shine-r` to the element's radius when it isn't `--r-xl`                                                                                                                                                                                              |
| `.shell`                                                                     | App frame atmosphere: lit relief over `--bg` and a top-left corner light (uses `::before`)                                                                                                                                                                                                                                                                             |
| `.shimmer`                                                                   | Working sweep along a pill's hairline (pair with a `Shimmer` label); Select, busy `Button`s and status pills use it                                                                                                                                                                                                                                                    |
| `.sr-only`, `.muted`, `.small`, `.block`, `.nowrap`, `.spacer`               | Utilities                                                                                                                                                                                                                                                                                                                                                              |
| `[data-arrow="up\|down"]`                                                    | Arrow on a tip pointing at its element; `--arrow-x` places it (the tooltips set both)                                                                                                                                                                                                                                                                                  |
| `[data-layer-root]`                                                          | Mark the app shell so popover scrims stack inside it (see `portalNear`)                                                                                                                                                                                                                                                                                                |
| `[data-floating]`                                                            | Put on a layer portalled to `<body>` so an open `Popover` doesn't treat clicks in it as outside                                                                                                                                                                                                                                                                        |

Every `<dialog>` opened with `showModal()` fades in while scaling down from 120% (180ms, decelerate curve) and leaves by flying 24px down while shrinking to 80% and fading out (200ms, accelerate curve). Scroll containers that float (menus,
popovers) can't host `.edge`; they paint it as background layers, as described in `css/effects.css`.

## Kitchen sink

`kitchensink/KitchenSink.svelte` shows every token, atom and component in its states, grouped as Actions, Inputs,
Overlays, Content, Feedback, Atoms, Typography and Foundations (one component each, built from `Section` and `Demo`; one `Demo`
per component, each of its states in a captioned `Case` inside it). Set `--page-inset` on the scroll area it sits in so its section rules run
edge to edge. Mount it in
a page of the app, under its h1, with the app's `<ContextMenu />` and `<Dialogs />` mounted as usual:

```svelte
<script>
  import KitchenSink from '$ds/kitchensink/KitchenSink.svelte'
</script>

<KitchenSink />
```

Check a change there, in both themes, with the keyboard and at a narrow width. A new component gets a `Demo`.

## Components

Each file starts with a comment giving its props and behaviour; that comment is the reference, and a JSDoc `Props`
typedef types them, so a TypeScript app gets its props checked. Every component that draws one main element passes
other attributes, `class` and attachments through to it (`<Notice class="spaced" {@attach tooltip('…')}>`): the
wrapper for display components, the control itself (input, button) for inputs, Popover and Select. In short:

| Component                                                                          | Use it for                                                                                                                                                                                                                                                                                                                                                                                                | Main props                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Icon`                                                                             | Any icon (Phosphor regular)                                                                                                                                                                                                                                                                                                                                                                               | `name`, `size` sm/md/lg, `label` (only if it carries meaning)                                                                                                                                                                                                                    |
| `empty/` (`Empty`, `Empty.Error`)                                                  | Empty state; `Empty.Error` for a view that failed to load, with a retry (an alert)                                                                                                                                                                                                                                                                                                                        | `title`, `body`, `level`, `icon`, children for actions; Error: `title`, `message`, `onretry` (may be async), `retryLabel`                                                                                                                                                        |
| `Button`                                                                           | Every `.btn` / `.icon-btn` with behaviour: an icon, async actions (spinner and `pendingLabel` while the promise runs, presses ignored meanwhile, a rejection's message in a bubble under it), links drawn as buttons                                                                                                                                                                                      | `variant` secondary/primary/danger, `small`, `icon`, `iconOnly` + `label`, `href`, `type`, `onclick` (may return a promise), `pending`, `pendingLabel`, `onerror`                                                                                                                |
| `ErrorMessage`                                                                     | Error text: inline, or a dismissible bubble under a control                                                                                                                                                                                                                                                                                                                                               | `message`, `id`, `floating`, `ondismiss`                                                                                                                                                                                                                                         |
| `Notice`                                                                           | Inline notice about a standing condition                                                                                                                                                                                                                                                                                                                                                                  | `tone`, `icon`, children for the text                                                                                                                                                                                                                                            |
| `Shimmer`                                                                          | "Working…" text                                                                                                                                                                                                                                                                                                                                                                                           | `text` or children, `active`, `as`                                                                                                                                                                                                                                               |
| `WorkingBorder`                                                                    | Comets circling a card that's busy                                                                                                                                                                                                                                                                                                                                                                        | none; set `--radius`                                                                                                                                                                                                                                                             |
| `side-menu/` (`SideMenu`, `SideMenu.Group`, `SideMenu.Item`)                       | App navigation column (Linear's sidebar): a header row with a raised main action, groups that fold under a muted heading, rows with an icon, a count and nested rows, all on shared icon, label and trailing columns                                                                                                                                                                                      | SideMenu: `label`, snippets `header` `actions`; Group: `title`, `open` (bindable), `ontoggle`; Item: `label`, `href` (else a button), `icon`, `current`, `count`, `trailing`, `open` (bindable), `ontoggle`, children for sub-items                                              |
| `tiles/` (`Tile`, `Tile.Group`)                                                    | A bordered box with a title, icon and any content that the whole of answers the pointer (Prose UI's cards, Carbon's tiles): a link or button (call to action, arrow that nudges on hover), a checkbox (toggled only by its top row, so its content can hold controls), or one option of a group; `Tile.Group` makes one choice (radios, arrow keys) or several (`multiple`) of the tiles in it, in a grid | Tile: `title`, `icon`, `href` (+ `target`, `rel`), `onclick`, `checked` (bindable), `value` (in a group), `cta`, `arrow`, `horizontal`, `disabled`, children for content; Group: `value` (bindable), `label`, `hideLabel`, `info`, `multiple`, `columns`, `disabled`, `onchange` |
| `metadata/` (`Metadata`, `Metadata.Row`)                                           | Labelled values (Linear's project properties): a label column, as wide as the longest, then each row's values (usually `.chip-btn` pills), wrapping when narrow; a label can be a button. Its labels' text lines up with the content around it                                                                                                                                                            | Metadata: children for rows; Row: `label`, `onlabelclick`, `labelTip`, children for the values                                                                                                                                                                                   |
| `Collapsible`                                                                      | Section in a panel                                                                                                                                                                                                                                                                                                                                                                                        | `title`, `open` (bindable), `ontoggle`, `count`, `meta`, `info`                                                                                                                                                                                                                  |
| `CollapsibleAdvanced`                                                              | Collapsible card with status                                                                                                                                                                                                                                                                                                                                                                              | `title`, `open`, `variant`, `dimmed`, `expandable`, `loading`, snippets `lead` `meta` `end` `actions`                                                                                                                                                                            |
| `Splitter`                                                                         | Resizing a panel                                                                                                                                                                                                                                                                                                                                                                                          | `value`, `min`, `max`, `defaultValue`, `side`, `oninput`, `onchange`                                                                                                                                                                                                             |
| `Popover`                                                                          | Button that opens a panel                                                                                                                                                                                                                                                                                                                                                                                 | `id`, `label`, `trigger` snippet, `badge`, `dot`, `align`, `placement`, `width`, `scrim`, `open` (bindable)                                                                                                                                                                      |
| `Tooltip`                                                                          | Hover or focus tip around content                                                                                                                                                                                                                                                                                                                                                                         | `tip` snippet, `focusable`                                                                                                                                                                                                                                                       |
| `InfoTip`                                                                          | ⓘ button with label/text lines: the place for descriptions and help text                                                                                                                                                                                                                                                                                                                                  | `lines`, `label`, `pinnable`                                                                                                                                                                                                                                                     |
| `AnchorHeading`                                                                    | A heading with a link to itself after its text, shown on hover or focus, for sharing part of a long page (sized by `.prose` or the app)                                                                                                                                                                                                                                                                   | `id`, `level` 1–6, `label`, children for the text                                                                                                                                                                                                                                |
| `Md`                                                                               | Inline markdown, no `{@html}`                                                                                                                                                                                                                                                                                                                                                                             | `text`                                                                                                                                                                                                                                                                           |
| `menu/MenuButton`                                                                  | Visible ⋯ twin of a context menu                                                                                                                                                                                                                                                                                                                                                                          | `items` (function), `label`                                                                                                                                                                                                                                                      |
| `Table`                                                                            | Data table in a lit card: sortable columns, collapsible row groups, sticky header, row menu                                                                                                                                                                                                                                                                                                               | `columns`, `rows` or `groups`, `key`, `cell` snippet, `sort` and `collapsed` (bindable), `selected`, `onselect`, `rowMenu`, `rowLabel`, `label`, `emptyGroup`                                                                                                                    |
| `Toast`                                                                            | The toast stack (app owns the list)                                                                                                                                                                                                                                                                                                                                                                       | `toasts`, `onhold`, `ondismiss`                                                                                                                                                                                                                                                  |
| `inputs/TextField`, `SearchField`, `TextArea`                                      | Text entry                                                                                                                                                                                                                                                                                                                                                                                                | `value` (bindable), `id`, `label`, `hideLabel`, `placeholder`, `shortcut`, `onenter`, `error`, `info`, native constraints (`required`, `pattern`…); `focus()`                                                                                                                    |
| `inputs/Select`                                                                    | Dropdown                                                                                                                                                                                                                                                                                                                                                                                                  | `value` (bindable), `options`, `id`, `label`, `groupActions`, `loading`, `error`, `info`, `ghost` (flat, not raised), `disabled`                                                                                                                                                 |
| `inputs/Segmented`, `ButtonGroup`, `RadioGroup`                                    | One choice of a few: separate pills; one joined pill; a track with the choice raised on it                                                                                                                                                                                                                                                                                                                | `value`, `options`, `label`, `onchange`, `iconOnly`; RadioGroup: `fill`, `pill`                                                                                                                                                                                                  |
| `inputs/TagInput`                                                                  | A list of short values (names, labels) typed into one field                                                                                                                                                                                                                                                                                                                                               | `value` (bindable array), `id`, `label`, `hideLabel`, `placeholder`, `info`, `error`, `separator`, `normalize`, `validate`                                                                                                                                                       |
| `inputs/Switch`                                                                    | On/off                                                                                                                                                                                                                                                                                                                                                                                                    | `checked` (bindable), `id`, `label`, `hint`; other props and attachments go to the button                                                                                                                                                                                        |
| `inputs/Slider`                                                                    | Number in a range                                                                                                                                                                                                                                                                                                                                                                                         | `value` (bindable), `min`, `max`, `step`, `id`, `label`, `format`                                                                                                                                                                                                                |
| `inputs/RangeSlider`                                                               | A range of numbers: two thumbs on one track that can't cross                                                                                                                                                                                                                                                                                                                                              | `value` (bindable `[from, to]`), `min`, `max`, `step`, `gap`, `id`, `label`, `format`                                                                                                                                                                                            |
| `inputs/DatePicker`, `DateRangePicker`                                             | A day, or a span of days: typed as DD/MM/YYYY (or ISO), or picked from a calendar under the field (ISO days, `lib/dates.js`); the range has a from and a to input, or takes two presses, and ready-made spans (Last 7 days…) beside the calendar                                                                                                                                                          | `value` (bindable: `'2026-11-18'`, or `[from, to]`), `id`, `label`, `min`, `max`, `allowed` (DatePicker: the only days allowed), `shortcuts` (DateRangePicker), `placeholder`, `clearable`, `error`, `info`, `hideLabel`, `disabled`                                             |
| `inputs/DateRangeSelect`                                                           | A compact span between two of a given list of days or moments (irregular runs): a button opening the list, newest first, picked with two presses, and shortcuts (Most recent, Last 3, This month)                                                                                                                                                                                                         | `value` (bindable: `[from, to]`), `dates`, `id`, `label`, `shortcuts`, `placeholder`, `error`, `info`, `hideLabel`, `disabled`                                                                                                                                                   |
| `inputs/Calendar`, `inputs/DateField`, `inputs/DateInput`, `inputs/RangeShortcuts` | The parts the pickers are made of (a month grid; the field and its panel; the shortcut buttons), for a picker of your own                                                                                                                                                                                                                                                                                 | see their header comments                                                                                                                                                                                                                                                        |
| `upload/` (`Upload.File`, `.Files`, `.Folder`, `.Image`, `.Images`)                | File pickers that take drops too. The button becomes what it picked: a card with the name and size (a folder's file count), or a square thumbnail for an image, with a ✕ to clear it; the plural ones list their files (cards, or a grid of thumbnails) above a button that adds more                                                                                                                     | `file` / `files` / `folder` (bindable), `onchange`, `label`, `accept`, `id`, `disabled`, `error`; `Files`: `addLabel`; `Image`, `Images`: `maxSize` (bytes, default 10 MB)                                                                                                       |
| `upload/UploadZone` (`Upload.Zone`)                                                | A larger place to drop files for the Upload inside it: a dashed area with a hint, or with `bare` any area (a card, a dialog's body), covered by a drop overlay only while files are over it                                                                                                                                                                                                               | `bare`, `hint` (default: the Upload's own, such as "Drop images here"), children                                                                                                                                                                                                 |
| `menu/ContextMenu`                                                                 | The menu layer; mount once                                                                                                                                                                                                                                                                                                                                                                                | none                                                                                                                                                                                                                                                                             |
| `Dialogs`                                                                          | The layer for `alertDialog`, `confirmDialog` and `promptDialog`; mount once                                                                                                                                                                                                                                                                                                                               | none                                                                                                                                                                                                                                                                             |
| `Modal`                                                                            | A modal dialog of your own (forms, multi-step flows, a question with more than OK and Cancel): the panel, its header and ✕, backdrop and Esc wiring; body and footer are children                                                                                                                                                                                                                         | `title`, `narrow`, `closeButton`, `locked`, `canClose`, `onclose`; `show()`, `requestClose()`, `close()`, `isOpen()`; `--dialog-width`                                                                                                                                           |
| `Drawer`                                                                           | A side sheet (modal dialog along the window's edge) for details or a longer form beside the page; resizable by its inner edge                                                                                                                                                                                                                                                                             | `label`, `side`, `width` (bindable, `undefined` = default), `defaultWidth`, `minWidth`, `resizable`, `onresize`, `canClose`, `locked`, `onclose`; `show()`, `requestClose()`, `close()`, `isOpen()`                                                                              |

Option shape for `Select`, `Segmented`, `ButtonGroup` and `RadioGroup`: `{ value, label, icon?, hint? }`, plus `text`
and `group` for `Select`, `done` for `Segmented`, `info` for `RadioGroup`.

### Icons

`Icon` ships about forty general-purpose glyphs (carets, check, x, search, more, undo, eye, gear, sun, moon…;
`iconNames()` lists them). An app registers the rest once, before it mounts:

```js
import { registerIcons } from '$ds/components/Icon.svelte'
import trophy from '@phosphor-icons/core/regular/trophy.svg?raw'
registerIcons({ trophy })
```

One family, regular weight. The `?raw` import is Vite's.

### Context menus

```svelte
<ContextMenu />
<!-- once, at the root -->

<li {@attach contextMenu(() => rowMenu(row), 'Row actions')}>
  …
  <MenuButton items={() => rowMenu(row)} label={row.name} />
</li>
```

Where text can't be selected (base.css: buttons, lists, menus, pickers, labels), the mounted layer also cancels the
browser's drag and right-click menu. Content, toasts, alerts, text fields and links keep theirs; Shift + right-click always
gets the browser's menu. To make a component's own chrome behave this way, give it `user-select: none`; to keep a part
selectable, `user-select: text`.

Items: `{ label, icon?, action?, href?, hint?, checked?, toggle?, disabled?, danger?, children? }` or `{ separator: true }`. `icon` sits in
the column on the left (a checked item shows its check there instead). A `toggle` item shows `checked` as a switch on the right;
pressing it flips the switch, calls `action(on)` with the new state and leaves the menu open.
Right-click, Shift+F10 and the Menu key open it; text fields keep the browser's menu. Always pair a context
menu with a `MenuButton`, so nothing is reachable by right-click only.

### Modal

```svelte
<Modal bind:this={modal} title="New site" canClose={confirmDiscard} onclose={reset}>
  <form id="new-site" class="dialog-body" novalidate onsubmit={submit}>…</form>
  <footer class="dialog-foot">
    <span class="spacer"></span>
    <button type="button" class="btn" onclick={() => modal.requestClose()}>Cancel</button>
    <button type="submit" form="new-site" class="btn btn-primary">Create</button>
  </footer>
</Modal>
```

```js
// Every way of closing (✕, Esc, backdrop, requestClose) asks this first; false keeps it open.
async function confirmDiscard() {
  if (!dirty) return true
  return confirmDialog({ title: 'Discard this site?', confirmLabel: 'Discard', cancelLabel: 'Keep editing', danger: true })
}
```

`locked` holds it open (✕ disabled) while work it shows has to finish; `close()` still closes it. The children are
the body and footer, so each step of a flow can swap them. Other attributes and attachments go to the `<dialog>`.

### Alert, confirm and prompt

Promise-based stand-ins for the browser's, in a `.dialog.confirm` above whatever dialog is open (a form under it
keeps its state). Mount `<Dialogs />` once; requests made while one shows wait their turn.

```js
await alertDialog({ title: 'Upload failed', body: 'The file is over 50 MB.' })
if (await confirmDialog({ title: 'Discard changes?', confirmLabel: 'Discard', cancelLabel: 'Keep editing', danger: true })) close()
const name = await promptDialog({ title: 'Rename', label: 'Name', value: old, validate: (v) => (v.trim() ? '' : 'Enter a name') })
```

A string is taken as the title. Esc, a backdrop click and cancel answer `undefined` / `false` / `null`. `danger`
makes the confirm button red and starts the focus on cancel. A prompt's `validate` runs on confirm only.

### Toast

```js
// app state: oldest first, newest last
const timers = new Map()
let held = false
const arm = ({ id, ms }) =>
  timers.set(
    id,
    setTimeout(() => dismiss(id), ms),
  )
export function toast(message, action = null, ms = 5000) {
  const t = { id: crypto.randomUUID(), message, action, ms }
  app.toasts.push(t)
  if (!held) arm(t)
}
export function dismiss(id) {
  clearTimeout(timers.get(id))
  timers.delete(id)
  app.toasts = app.toasts.filter((t) => t.id !== id)
}
export function hold(on) {
  held = on
  for (const timer of timers.values()) clearTimeout(timer)
  timers.clear()
  if (!on) app.toasts.forEach(arm)
}
```

```svelte
<Toast toasts={app.toasts} onhold={hold} ondismiss={dismiss} />
```

The newest toast is in front with up to two older ones peeking out behind it; hovering or focusing the stack fans it
out and holds every timer.

## Helpers (`lib/`)

| Export                                                         | What it does                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `portal`, `portalNear(from)`                                   | Attachments that move a node to `<body>` or the nearest `[data-layer-root]`                                                                                                                                                                                                                                                                                     |
| `announce(text, { delay? })`, `cancelAnnouncement()`           | The page's one polite live region (moved into the open modal, since outside it is inert). `fieldErrors` uses it for an error that appears as a field is left; `TagInput` for tags added, removed or refused                                                                                                                                                     |
| `invalid(errorId)`                                             | Attachment: `aria-invalid` ("true", else "false") and the message's id in `aria-describedby` on a control or group, every field alike. `FIRST_INVALID`: the selector for the control to focus after a failed submit                                                                                                                                             |
| `dates`                                                        | ISO day helpers for pickers: `parse`, `today`, `addDays`, `addMonths`, `monthGrid`, `formatDay`, `within`, `clamp`…                                                                                                                                                                                                                                             |
| `composing(event)`                                             | True while a key belongs to an IME composition (`isComposing`, or `keyCode` 229 for Safari): return early from a field's own Enter / Esc / Backspace handling                                                                                                                                                                                                   |
| `radioKeys`                                                    | Attachment for a `role="radiogroup"` with roving focus: arrows, Home and End move to an option and choose it (what `Segmented`, `ButtonGroup` and `RadioGroup` use)                                                                                                                                                                                             |
| `topLayer(from)`                                               | Attachment that shows a floating node in the top layer, above modal dialogs (inside the dialog around `from`, else `<body>`)                                                                                                                                                                                                                                    |
| `backdropClose(close)`                                         | Handlers to spread on a `<dialog>`: closes on a true backdrop click only                                                                                                                                                                                                                                                                                        |
| `closeRequests(request)`                                       | Handlers to spread on a `<dialog>` that must ask before closing: Esc (however fast it is repeated) and other close requests call `request` instead of closing                                                                                                                                                                                                   |
| `fade`, `fly`, `slide`, `scale`                                | Svelte's transitions on Material 3's motion rules: decelerate curve going in (250ms), accelerate going out (200ms), 0ms under reduced motion. Extra params `emphasized` (the emphasized set, for transitions that should draw the eye: 400ms in, 200ms out), `duration` (ms, both ways) and `curve: 'standard'` (one curve both ways, 300ms; `slide`'s default) |
| `pop({ from?, start?, distance?, duration? })`                 | For a small floating layer (list, menu, tip, panel): fades while growing from 97% out of `from` (an element or `{ x, y }`) and moving 4px away from it, on whichever side it ended up; 150ms in, 100ms out, 0ms under reduced motion. `<ul transition:pop={{ from: button }}>`                                                                                  |
| `flip`                                                         | `animate:flip` on the standard curve, 300ms by default                                                                                                                                                                                                                                                                                                          |
| `tween(value, { emphasized?, duration? })`                     | A `Tween` from `svelte/motion` on the standard curve, for a value that changes in place                                                                                                                                                                                                                                                                         |
| `durations`, `easings`, `defaults`                             | Material 3's duration tokens (`short1` 50 … `extraLong4` 1000), curves (`easings.standard.decelerate` and so on) and each curve's usual duration, for custom transitions                                                                                                                                                                                        |
| `motion(ms)`                                                   | Duration for a custom transition; 0 under reduced motion (`prefersReducedMotion` from `svelte/motion`)                                                                                                                                                                                                                                                          |
| `scrollFade({ size? })`                                        | Attachment: fades a scroll area's top and bottom edges while there is more to scroll                                                                                                                                                                                                                                                                            |
| `fileDrop({ ondrop, ondragging?, disabled? })`                 | Attachment: a drop target for files and folders (`data-dragging` while they are over it); `ondrop` gets what `dropped(dataTransfer)` reads                                                                                                                                                                                                                      |
| `filesOfDrop(drop)`, `droppedFiles(drop)`, `filesUnder(entry)` | A drop's files with their paths (one folder: paths inside it, and its name); its loose files without folders; every file under a dropped entry                                                                                                                                                                                                                  |
| `accepts(file, accept)`, `fileSize(bytes)`, `preview(file)`    | Whether a file fits an `accept` list (for drops, which skip the picker's filter); a size for display; an attachment showing a file in an `<img>` through an object URL it revokes                                                                                                                                                                               |
| `morph(node, key)`                                             | Call during init: animates the element's width and height when `key` changes, so it reshapes into its new content (what Upload's button does)                                                                                                                                                                                                                   |
| `fieldErrors(validate)`                                        | A form's error messages with submit-first timing (nothing shows until `validate()`, then fields recheck on blur): `{...form.field('name')}` on a text field, `{@attach form.group('name')}` on a wrapper, `form.validate()` on submit                                                                                                                           |
| `tooltip(text, { shortcut?, detail? })`                        | Attachment: tooltip on hover and keyboard focus, above dialogs too. Required on icon-only buttons and terse toggles. `detail`: a second line under the bold text (a full file name)                                                                                                                                                                             |
| `validity(error, report)`                                      | Attachment: ties an `<input>` or `<textarea>` to the browser's constraint validation (what the `error` prop of the text fields uses)                                                                                                                                                                                                                            |
| `contextMenu`, `menu`, `openMenu`, `openMenuFrom`, `closeMenu` | Context menu state and attachment                                                                                                                                                                                                                                                                                                                               |
| `alertDialog`, `confirmDialog`, `promptDialog`                 | Promise-based alert, confirm and prompt, drawn by `<Dialogs />`                                                                                                                                                                                                                                                                                                 |
| `inlineMd(text)`                                               | Parses inline markdown into parts (what `Md` renders)                                                                                                                                                                                                                                                                                                           |
| `spotlight(id, { timeout? })`                                  | Waits for the element with that id (or the collapsed toggle whose `aria-controls` names it) to appear, reveals it (clicks the toggle, opens a closed `<details>` around it), scrolls to it and flashes it briefly. Call it right after opening what holds it. Resolves to the element or null                                                                   |

## Fonts

`fonts.js` bundles Inter and JetBrains Mono (variable), so nothing loads from the network. To use other faces,
skip the import and set `--font-body`, `--font-display` and `--font-data` in your CSS; the weights 510 and 590
assume a variable font.

## Conventions the system relies on

- Breakpoint: one, at 860px. Below it `Splitter` hides, popovers span the width and fields grow to 16px text.
- Text sizes are in px. Boxes that hold text take a `min-height`, not a fixed `height`, so a label that wraps grows the
  box instead of spilling out of it.
- Reduced motion: CSS animations stop and transitions keep only colour changes (nothing moves, scales or loops), globally; Svelte transitions come from `lib/motion.js` (or take `motion(ms)`).
- Accessibility: every text and background pair meets WCAG AA in both themes; pointer targets are at least
  24×24px; focus rings come from `:focus-visible` in `base.css`.
- Contrast settings: with `prefers-contrast: more` the hairlines, scrollbar and quiet text tokens strengthen (boundaries
  3:1, `--muted`/`--faint` text 4.5:1, both themes; `tokens.css`). In forced colours (Windows High Contrast) the
  shadows and gradients that draw field boxes, focus rings, floating edges and chosen states are replaced by
  outlines, borders and system-colour fills (`base.css`). A new component that marks state or an edge only with a
  shadow, gradient or fill adds its own forced-colours rule.
- Browser support: current Chromium, Firefox and Safari (`color-mix()`, `@property`, `@starting-style`,
  `offset-path`, Svelte 5.29+ for `{@attach}`).

## Adding to it

See `CLAUDE.md` in this folder for the rules (they apply to people as well). The test for whether something
belongs here: could a different app use it without changing it?
