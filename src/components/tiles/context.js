// What a TileGroup hands the Tiles inside it, so a tile with a `value` becomes one of its options.

/**
 * @typedef {object} TileGroupContext
 * @property {boolean} multiple any number may be chosen (checkboxes), not one (radios)
 * @property {boolean} disabled every option is out of reach
 * @property {(value: string) => boolean} isChosen
 * @property {(value: string) => void} choose picks it (one choice) or toggles it (multiple)
 * @property {(value: string) => 0 | -1 | undefined} tabStop the option's tabindex: with one choice, only the chosen one
 *   (the first when none is) is in the tab order and arrows move between them; with multiple, every one is
 * @property {(value: string) => () => void} register adds an option that can be reached, in page order; returns its removal
 */

export const TILE_GROUP = Symbol('tile-group')
