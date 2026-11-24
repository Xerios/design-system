# Changelog

What changed in each release of `@xerios/design-system`, newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [semver](https://semver.org/): while on
0.x, a breaking change (a renamed or removed token, class, prop or export) bumps the minor version, anything else the
patch. Breaking entries are marked **Breaking** and say what to change in an app.

## [Unreleased]

## [0.1.5] - 2026-11-24

### Added

- `ActionCard` (`components/action-card/`): a card of content with the actions that apply to it (edit, copy,
  polish…) attached: in its top-right corner (on the title's row or, with no title, floated with the text wrapping
  round them), or in a row under it (`placement="bottom"`, `align`). `ActionCard.Action` is one action, an icon and a
  label: with `labels="fit"` (the default at the bottom) the labels show while they fit and the actions drop to icons
  with tooltips once the card is too narrow. `inline` puts a line of content (a command, a key) and its actions on one
  row. `copy` adds a Copy action that turns to a tick once copied;
  `reveal="hover"` hides the actions until the card is hovered or focused.
- `Icon`: the built-in `copy` glyph.

### Changed

- `Select`, `DatePicker`, `DateRangePicker`, `DateRangeSelect`: disabled, the button keeps its caret, faded, and shows
  the not-allowed cursor, so it still reads as a dropdown that can't be opened right now (the caret used to disappear).

## [0.1.4] - 2026-11-24

### Added

- `.field-row`: a field with buttons beside it. The buttons sit on the field's control rather than its label: a `.btn`
  grows to the field's height, and a ghost `.icon-btn` (or `.btn-small`, `.chip-btn`, `.label-chip`) is centred on it.
- `--control-h` (32px): the height of a form control's line. `TextField`, `Select`, `TagInput`, `DatePicker`,
  `DateRangePicker` and `DateRangeSelect` read it, so setting it on a container resizes them together.
- `SideTip`: a card of rich detail (a heading, text, lists, code) beside a list, level with its active item.
- `Select`, `OptionList`: an option's `detail` shows a `SideTip` card beside the list while that option is under the
  pointer or the keyboard, read with the option. A string is its text, `{ title, text }` a heading and text; the
  `detail` snippet draws anything richer.
- `Select`: an `item` snippet draws each option's row in the list (an avatar, a second line, a badge) in place of its
  text and hint; it gets the option and `{ selected, active }`. On the chosen row the text tokens turn to the brand's
  ink, so a row's muted text stays readable there.

### Fixed

- `Select`, `DateRangeSelect`, `DatePicker`, `DateRangePicker` and `FilterBar`'s panels: the list, pulled a little to
  the left of its field, is as much wider, so it overhangs both edges of the field evenly instead of falling short on
  the right.

## [0.1.3] - 2026-11-22

### Added

- `ScrollToTop`: a floating "back to top" pill (an up arrow and its label) that rises in at the bottom corner of the
  window or a scroll area once you are a screenful down.
- `ScrollMore`: a floating cue that there is more below, a gently bobbing down arrow (or a pill with its label) that
  scrolls on by a screenful, or to the end (`toEnd`); shown until the area is scrolled, or whenever more is below
  (`until="end"`).
- `Icon`: the built-in `arrowUp`, `arrowUpBold` and `arrowDownBold` glyphs.
- `lib/edge-glow.js`: `edgeGlow(area, { side, duration, announce })` lights a scroll area's bottom (or top) edge with a
  soft metallic glow and sends ripples out of it, to say new content arrived past it. The glow fades first; the
  ripples, and the line on the edge, last until it ends, after a while or once that edge is scrolled to.
- Tokens: `--sheen-lo`, `--sheen-hi` and `--sheen-tint` (the working shimmer's metal tones and indigo glint),
  `--sheen-cool`, `--sheen-rose` and `--sheen-gold` (the muted colours of metal's sheen) and
  `--edge-glow-strength`.
- `lib/dates.js`: `formatShort` ('18 Nov', '18 Nov 2025 15:30') and `formatSpan` ('3–18 Nov', '28 Oct – 3 Nov',
  '14:30–16:00 18 Nov') write a day or a span for reading, with the month's short name and what both ends share once;
  `year: true` shows the year even when it is this one.
- `DateInput`: `oncommit(day, enter)` runs after what was typed becomes the value.

### Changed

- `.shimmer` (the working sweep along a pill's edge: a busy `Button`, `Select` loading, status pills) and
  `WorkingBorder`: in the metal of the new-content glow (`--sheen-*`), silver with an indigo glint and touches of cyan,
  rose and gold on dark, grey and violet on light, instead of indigo and greys (and violet, pink and amber comets).
- `Empty.Error`: laid out side by side: a larger warning icon on the left, a vertical rule, and the title, message
  and actions to its right, aligned left (they were stacked and centred).
- `--brand`, `--accent`, `--link` (and everything built on them: `--accent-soft`, `--accent-line`, `--ring`,
  `--control-*`, `--glow`): the default accent is teal instead of indigo. Primary buttons, focus rings, ticks, links and
  the tint on controls all turn teal; an app that sets its own `--brand` / `--accent` sees no change.
- `DatePicker`, `DateRangePicker`: the field is a button showing the value briefly ('18 Nov', '3–18 Nov'; the year only
  when it isn't this year), with a calendar icon and a caret. The typed input (two for the range) moves into the panel,
  above the calendar, with the clear button at its end, and takes the focus as it opens; a typing error shows under it.
  Enter in it sets the value and closes. Attributes and attachments now go to the button; `placeholder` is the
  button's text with no value.
- `DateRangePicker`: after the first press on the calendar, the inputs show that day in "from" and "to" is empty.
- `Calendar`, `DatePicker`, `DateRangePicker`: weeks start on Monday by default instead of the locale's first day;
  `weekStart` (1 Monday … 7 Sunday, or 'locale') changes it. `monthGrid` takes the same as a second argument.
- `DatePicker`, `DateRangePicker`: the button shows the year whenever it has room for it ('18 Nov 2026',
  '3–18 Nov 2026'), dropping this year's number only when it is too narrow.
- `Select`, `OptionList` with `multiple={false}`: the chosen option is filled solid with the brand colour (as a chosen
  day in `Calendar`) instead of carrying a tick, and the rows lose the tick column.
- Light theme is flat: buttons, select triggers, chosen segments, tiles and upload pills lose their lit top edge,
  contact ring and drop (`--shadow-btn`, `--solid-edge`, `--raised-edge`, `--raised-base`); fields and switch tracks
  lose their sunken relief (`--sunken-shadow`, `--shadow-sm`); cards, tables and dialogs lose the lit corner, the
  `.shine` beam and their resting drop (`--edge-hi`, `--edge-shadow`, `--shine`, `--view-shadow`). Every edge is its
  plain hairline. Soft shadows stay in three places: a short drop under raised controls (`--shadow-btn`, which also
  shades them softly from top to bottom so they read as gently rounded) and the view card (`--view-shadow`), and a
  wide, soft one under floating layers (`--shadow`). `--shadow-md` is quieter. Dark is unchanged.
- `Calendar` (and the pickers' calendars): the mouse wheel or a trackpad turns the page (down: next month, up:
  previous), stopping where the arrows do.
- `Calendar`: turning the page scrolls the weeks: the weeks two months share glide to their new place, the others slide
  out and in under the day names. A jump to another month or year slides the whole grid.
- `Calendar`: the month and the year in its head are dropdowns (ghost `Select`s) instead of buttons that swapped the
  grid for a page of months or years. The month list holds the months with a day to pick; the year list runs from
  `min` to `max` (without them, 3 years back to 1 ahead, plus the year shown if it is further) and has a search field
  when it holds more than 8.
- `Calendar`: one fixed width (the days' grid), so the pickers' panels keep their size from month to month; a long
  month name is cut off with an ellipsis in the head rather than widening it.
- `Calendar`: a hairline under the day names, which are dimmer (`--faint`), and one down the grid where the workdays
  meet the weekend (the user's locale's; Saturday and Sunday by default). `weekendDays()` in `lib/dates.js` gives it.
- `DateRangePicker`: no "Pick the first day" hint above the calendar; after the first press, only screen readers are
  told to pick the last day.
- `DateInput`: leaving it without an edit no longer re-reads the value.
- `DatePicker`, `DateRangePicker`, `parseInput`: typed dates are read with any-date-parser (a new dependency), so
  month names ('18 Nov', '18 novembre'), a missing year ('18/11', this year) and words ('today', 'tomorrow', '3 days
  ago') read too. Numbers are still day first.
- `DateRangeSelect`: a calendar icon on the button. The button and the list show months by their short name instead
  of numbers, and a span as briefly as it can be said ('3–18 Nov', '14:30–16:00 18 Nov').
- **Breaking** `DateField`: the field is a button and the `inputs` snippet is drawn in a box at the top of the panel
  (with the clear button), given `close`. `calendarLabel` is gone; pass the value's text as `text` (and
  `placeholder`). `show()` takes no argument and focuses the panel's `[data-autofocus]` element.

### Deprecated

- `--shimmer-image-dark` and `--shimmer-image-light`: the working stripe is one image for both themes now; use
  `--shimmer-image`.

### Fixed

- `DatePicker`, `DateRangePicker` (`DateField`), `FilterBar`'s panels: a press or the focus in a layer opened from
  inside the panel (a `Select`'s list) no longer closes the panel.

## [0.1.2] - 2026-11-20

### Changed

- `Dialogs` (`alertDialog`, `confirmDialog`, `promptDialog`): under 860px the dialog sits at the bottom of the screen with its buttons sharing the row; cancel and confirm are spaced further apart.
- `.dialog`: its backdrop can't be selected.
- `--ease-spring` (a modal dialog's scale-in): a softer bounce, overshooting by about 8% instead of 20%.
- `ButtonGroup`, `Segmented`, `RadioGroup`: unchosen options have muted text until hovered; the chosen one stays clear.
- `FilterChip` (and `FilterBar`'s filters): resting fill a step stronger (`--control-2`), so a filter stands out more.

### Removed

- **Breaking** `Button`: the `pressed` prop and the flat look of a toggled `.btn[aria-pressed="true"]` are gone. Drop
  `bind:pressed` from your buttons; for an on/off choice use a `Switch`, `Segmented` or `ButtonGroup`.

## [0.1.1] - 2026-11-20

### Added

- `Button`: `pressed` (bindable) makes it a toggle button (`aria-pressed`), flipped on each press. Toggled on, a
  secondary `.btn` drops its fill and shadow and keeps its hairline; any `.btn[aria-pressed="true"]` gets the same look.

### Changed

- `ButtonGroup`, `Segmented`, `RadioGroup`: flat at rest; only the chosen option is filled and raised.
- `FilterBar`: a filter left with no value leaves `filters` at once; its chip stays on the row until its panel closes,
  and picking a value again puts it back in its place.
- `FilterBar`: Backspace in the add panel's value step goes back to the field list from any editor, unless it deletes
  something there (typed text, a word).

## [0.1.0] - 2026-11-20

First release: theme tokens, global CSS (`base`, `effects`, `atoms`), the components listed in the README and the
`lib/` helpers.

[Unreleased]: https://github.com/Xerios/design-system/compare/v0.1.5...HEAD
[0.1.5]: https://github.com/Xerios/design-system/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/Xerios/design-system/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/Xerios/design-system/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Xerios/design-system/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Xerios/design-system/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Xerios/design-system/releases/tag/v0.1.0
