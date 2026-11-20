<script>
  /**
   * A choice made of tiles: every Tile inside it with a `value` is one of its options. One choice (a radio group) or,
   * with `multiple`, any number (a group of checkboxes). For choices worth more than a word each: a plan, a template, a
   * region with its details. Lays the tiles out in a grid of equal columns that drops to fewer as it narrows.
   *
   *   <TileGroup label="Plan" bind:value={plan}>
   *     <Tile value="free" title="Free" icon="cloud">Up to 3 projects.</Tile>
   *     <Tile value="pro" title="Pro" icon="rocket">Unlimited projects.</Tile>
   *   </TileGroup>
   *   <TileGroup label="Notify me about" multiple bind:value={topics}>…</TileGroup>
   *
   * value: bindable. The chosen tile's value ('' for none yet), or with `multiple` the array of chosen values.
   * label: the group's name, shown above it; `hideLabel` keeps it for screen readers only.
   * info: help text behind an ⓘ next to the label.
   * note: dimmed text after the label, such as '(optional)' (see .label-note); screen readers read it as part of the label.
   * multiple: any number may be chosen (checkboxes) rather than one (radios).
   * columns: at most this many tiles to a row (default: as many as fit). Each is at least --tile-min wide (220px), so a
   * narrow container gets fewer, down to one.
   * disabled: every option out of reach.
   * onchange(value): after the choice changes.
   * Children: the tiles, in order. Other attributes, the class and attachments go to the group's outer box.
   * Keyboard: one choice: Tab reaches the chosen tile (the first when none is), the arrows move to the next or previous
   * and choose it, Home and End the first and last. Multiple: each tile is a tab stop, Space toggles it.
   *
   * @typedef {object} Props
   * @property {string | string[]} [value]
   * @property {string} label
   * @property {boolean} [hideLabel]
   * @property {string} [info]
   * @property {string} [note] dimmed text after the label, e.g. '(optional)'
   * @property {boolean} [multiple]
   * @property {number} [columns]
   * @property {boolean} [disabled]
   * @property {(value: string | string[]) => void} [onchange]
   * @property {import('svelte').Snippet} children
   */
  import { setContext, untrack } from 'svelte'
  import FieldLabel from '../inputs/FieldLabel.svelte'
  import { radioKeys } from '../../lib/roving.js'
  import { TILE_GROUP } from './context.js'

  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let {
    value = $bindable(),
    label,
    hideLabel = false,
    info,
    note = '',
    multiple = false,
    columns,
    disabled = false,
    onchange,
    children,
    class: className,
    ...rest
  } = $props()
  const uid = $props.id()

  /** The options that can be reached, in page order. */
  let options = $state(/** @type {string[]} */ ([]))
  const chosen = $derived(multiple ? (Array.isArray(value) ? value : []) : [value])
  // With one choice and none of the options chosen, the first is the tab stop.
  const first = $derived(!multiple && !options.some((o) => o === value) ? options[0] : undefined)

  /** @type {import('./context.js').TileGroupContext} */
  const group = {
    get multiple() {
      return multiple
    },
    get disabled() {
      return disabled
    },
    isChosen: (v) => chosen.includes(v),
    choose(v) {
      if (multiple) {
        const list = Array.isArray(value) ? value : []
        value = list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
      } else if (value === v) return
      else value = v
      onchange?.(value)
    },
    tabStop: (v) => (multiple ? undefined : v === value || v === first ? 0 : -1),
    // Untracked: a tile calls this from its $effect, and push and indexOf read the list, which would make every tile's
    // effect depend on it. Each tile joining would then rerun the others' effects, which leave and join again, forever.
    register(v) {
      untrack(() => options.push(v))
      return () => {
        untrack(() => {
          const at = options.indexOf(v)
          if (at >= 0) options.splice(at, 1)
        })
      }
    },
  }
  setContext(TILE_GROUP, group)
</script>

<div class={['tile-group', className]} {...rest}>
  <FieldLabel id="{uid}-label" {label} {note} {info} {hideLabel} />
  <div
    class="tiles"
    class:capped={!!columns}
    style:--tile-columns={columns}
    role={multiple ? 'group' : 'radiogroup'}
    aria-labelledby="{uid}-label"
    aria-disabled={disabled || undefined}
    {@attach multiple ? undefined : radioKeys}
  >
    {@render children()}
  </div>
</div>

<style>
  .tile-group {
    display: grid;
    gap: var(--space-2);
    min-width: 0;
  }
  /* Equal columns at least --tile-min wide, as many as fit; tiles in a row share its height. */
  .tiles {
    --tile-gap: var(--space-2);
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--tile-min, 220px)), 1fr));
    gap: var(--tile-gap);
    align-items: stretch;
  }
  /* At most --tile-columns to a row: each column is at least that share of the row, so no more fit. */
  .tiles.capped {
    grid-template-columns: repeat(
      auto-fill,
      minmax(max(min(100%, var(--tile-min, 220px)), calc((100% - (var(--tile-columns) - 1) * var(--tile-gap)) / var(--tile-columns))), 1fr)
    );
  }
</style>
