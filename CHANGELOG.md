# Changelog

What changed in each release of `@xerios/design-system`, newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [semver](https://semver.org/): while on
0.x, a breaking change (a renamed or removed token, class, prop or export) bumps the minor version, anything else the
patch. Breaking entries are marked **Breaking** and say what to change in an app.

## [Unreleased]

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

[Unreleased]: https://github.com/Xerios/design-system/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/Xerios/design-system/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Xerios/design-system/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Xerios/design-system/releases/tag/v0.1.0
