<script>
  /**
   * Data table in a lit card: sortable columns, optional groups shown as collapsible row sections, a sticky header, and
   * an optional row menu (right-click plus a visible ⋯ button in a trailing column). It scrolls inside its own box both
   * ways, so in a parent of limited height (a flex column) the header stays in view and the horizontal scrollbar too.
   *
   *   <Table columns={cols} rows={people} key={(p) => p.id} label="People" />
   *
   *   <Table columns={cols} groups={teams} key={(p) => p.id} bind:sort rowMenu={menuFor} rowLabel={(p) => p.name}>
   *     {#snippet cell(person, col)}
   *       {#if col.key === 'name'}<a href="/people/{person.id}">{person.name}</a>{:else}{col.value?.(person)}{/if}
   *     {/snippet}
   *   </Table>
   *
   * Props:
   * - `columns`: [{ key, label, title?, value?, sortValue?, desc?, num?, center?, shrink?, header?, hideLabel? }]
   *     `value(row)`: the cell's text when there is no `cell` snippet. `sortValue(row)`: a comparable value; the column is
   *     sortable only with it. `desc`: the first click sorts descending (the default for `num` columns). `num`: right-
   *     aligned tabular figures. `center`: centred. `shrink`: as narrow as its content. `header`: the cell is the row's
   *     header (<th scope="row">), normally the name column. `hideLabel`: the label is for screen readers only.
   *     `title`: a longer name for the sort tooltip.
   * - `rows`: the rows, for a table without groups. Or
   * - `groups`: [{ key, label, rows, sub?, tone?, info? }], each a collapsible section with a header row showing its row
   *     count. `tone` puts a coloured dot before the label (any `data-tone`); `info` is InfoTip text about the group.
   * - `key(row)`: a unique id per row. It also lands on the row as `data-row`, so an app can find it again.
   * - `cell`: snippet (row, column) drawing a cell's content. Without it a cell shows `column.value(row)`.
   * - `sort` (bindable): { key, dir } with dir 1 ascending or -1 descending; null keeps the given order. Equal values
   *     keep their given order too.
   * - `collapsed` (bindable): keys of the closed groups.
   * - `selected`, `onselect(row)`: with `onselect`, rows are focusable and Enter, Space or a click selects one;
   *     `selected` is the key of the one to highlight. Leave both out when rows hold their own links and buttons.
   * - `rowMenu(row)`: context menu items for a row (see contextMenu), with a ⋯ button in a last column. `rowLabel(row)`
   *     names the row for both.
   * - `label`: the table's accessible name. `emptyGroup`: the text in an open group with no rows.
   *
   * Keyboard: the sort and group buttons are ordinary buttons. Selectable rows take Tab, Enter and Space. Shift+F10 or
   * the Menu key opens a row's menu, as does its ⋯ button.
   */
  import Icon from './Icon.svelte'
  import InfoTip from './InfoTip.svelte'
  import MenuButton from './menu/MenuButton.svelte'
  import { contextMenu } from '../lib/menu.svelte.js'
  import { announce } from '../lib/announce.js'
  import { scrollFade } from '../lib/scroll-fade.js'
  import { tooltip } from '../lib/tooltip.js'

  /**
   * @typedef {object} Column
   * @property {string} key
   * @property {string} label
   * @property {string} [title] names the column in its sort tooltip when `label` is terse
   * @property {boolean} [hideLabel]
   * @property {boolean} [header] cells are row headers (<th scope="row">)
   * @property {boolean} [num]
   * @property {boolean} [center]
   * @property {boolean} [shrink]
   * @property {boolean} [desc] sorts descending first
   * @property {(row: any) => string | number} [sortValue] makes the column sortable
   * @property {(row: any) => unknown} [value] the cell's text when there is no `cell` snippet
   *
   * @typedef {object} Group
   * @property {string} key
   * @property {string} label
   * @property {any[]} rows
   * @property {string} [sub]
   * @property {string} [tone]
   * @property {string} [info]
   *
   * @typedef {object} Props
   * @property {Column[]} columns
   * @property {any[]} [rows]
   * @property {Group[] | null} [groups]
   * @property {(row: any) => string | number} key
   * @property {import('svelte').Snippet<[any, Column]>} [cell]
   * @property {{ key: string, dir: number } | null} [sort] bindable
   * @property {string[]} [collapsed] bindable
   * @property {string | number | null} [selected]
   * @property {(row: any) => void} [onselect]
   * @property {(row: any) => import('../lib/menu.svelte.js').MenuItem[]} [rowMenu]
   * @property {(row: any) => string} [rowLabel]
   * @property {string} [label]
   * @property {string} [emptyGroup]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let {
    columns,
    rows = [],
    groups = null,
    key,
    cell = undefined,
    sort = $bindable(null),
    collapsed = $bindable([]),
    selected = null,
    onselect = undefined,
    rowMenu = undefined,
    rowLabel = (row) => String(key(row)),
    label = undefined,
    emptyGroup = 'Nothing here.',
    class: className,
    ...rest
  } = $props()

  const grouped = $derived(Boolean(groups))
  const span = $derived(columns.length + (rowMenu ? 1 : 0))

  const list = $derived(groups ?? [{ key: '', label: '', rows }])

  // The comparator for the sorted column, or null to keep the given order. toSorted is stable: ties keep their order.
  const compare = $derived.by(() => {
    const column = sort && columns.find((c) => c.key === sort.key && c.sortValue)
    if (!column) return null
    return (a, b) => {
      const x = column.sortValue(a)
      const y = column.sortValue(b)
      const order = typeof x === 'string' && typeof y === 'string' ? collator.compare(x, y) : x < y ? -1 : x > y ? 1 : 0
      return order * sort.dir
    }
  })
  // Text sorts the way people read it: "app2" before "app10", case and accents aside.
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
  const ordered = (items) => (compare ? items.toSorted(compare) : items)

  function sortBy(column) {
    if (sort?.key === column.key) sort = { key: column.key, dir: -sort.dir }
    else sort = { key: column.key, dir: (column.desc ?? column.num) ? -1 : 1 }
    // The new order is said once (the header's aria-sort isn't reliably read out when it changes under the focus).
    announce(`Sorted by ${(column.title ?? column.label).toLowerCase()}, ${sort.dir > 0 ? 'ascending' : 'descending'}`, { delay: 0 })
  }

  const isOpen = (group) => !collapsed.includes(group.key)
  function toggle(group) {
    collapsed = isOpen(group) ? [...collapsed, group.key] : collapsed.filter((k) => k !== group.key)
  }

  function rowKeydown(e, row) {
    if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return
    e.preventDefault()
    onselect(row)
  }

  // A no-op attachment for rows without a menu, so the markup needs no branch.
  const noMenu = () => {}
</script>

<div class={['table-card', className]} {...rest}>
  <div class="table-scroll" {@attach scrollFade()}>
    <table aria-label={label}>
      <thead>
        <tr>
          {#each columns as column (column.key)}
            {@const active = sort?.key === column.key && column.sortValue}
            <th
              scope="col"
              class:num={column.num}
              class:center={column.center}
              class:shrink={column.shrink}
              aria-sort={active ? (sort.dir > 0 ? 'ascending' : 'descending') : undefined}
            >
              {#if column.sortValue}
                <button type="button" class="sort" {@attach tooltip(`Sort by ${(column.title ?? column.label).toLowerCase()}`)} onclick={() => sortBy(column)}>
                  <span class:sr-only={column.hideLabel}>{column.label}</span>
                  {#if active}<span class="caret" class:up={sort.dir > 0}><Icon name="caretDown" size="sm" /></span>{/if}
                </button>
              {:else}
                <span class="head" class:sr-only={column.hideLabel}>{column.label}</span>
              {/if}
            </th>
          {/each}
          {#if rowMenu}<th scope="col" class="shrink"><span class="sr-only">Actions</span></th>{/if}
        </tr>
      </thead>
      {#each list as group (group.key)}
        <tbody>
          {#if grouped}
            <tr class="group-row" data-tone={group.tone}>
              <th scope="rowgroup" colspan={span}>
                <div class="group-head">
                  <button type="button" aria-expanded={isOpen(group)} onclick={() => toggle(group)}>
                    <span class="chev" class:open={isOpen(group)}><Icon name="caretRight" size="sm" /></span>
                    {#if group.tone}<span class="swatch" aria-hidden="true"></span>{/if}
                    <span class="group-label">{group.label}</span>
                    {#if group.sub}<span class="group-sub">{group.sub}</span>{/if}
                  </button>
                  {#if group.info}<InfoTip pinnable label="About {group.label}" text={group.info} />{/if}
                  <span class="group-count">{group.rows.length}</span>
                </div>
              </th>
            </tr>
          {/if}
          {#if !grouped || isOpen(group)}
            {#each ordered(group.rows) as row (key(row))}
              {@const id = key(row)}
              <tr
                data-row={id}
                class:selectable={onselect}
                class:is-selected={onselect && id === selected}
                tabindex={onselect ? 0 : undefined}
                aria-selected={onselect ? id === selected : undefined}
                onclick={onselect ? () => onselect(row) : undefined}
                onkeydown={onselect ? (e) => rowKeydown(e, row) : undefined}
                {@attach rowMenu ? contextMenu(() => rowMenu(row), rowLabel(row)) : noMenu}
              >
                {#each columns as column (column.key)}
                  <svelte:element
                    this={column.header ? 'th' : 'td'}
                    scope={column.header ? 'row' : undefined}
                    class:num={column.num}
                    class:center={column.center}
                    class:shrink={column.shrink}
                    class:row-head={column.header}
                  >
                    {#if cell}{@render cell(row, column)}{:else}{column.value?.(row) ?? ''}{/if}
                  </svelte:element>
                {/each}
                {#if rowMenu}<td class="shrink actions"><MenuButton items={() => rowMenu(row)} label={rowLabel(row)} /></td>{/if}
              </tr>
            {:else}
              {#if grouped}
                <tr class="empty-row"><td colspan={span} class="muted small">{emptyGroup}</td></tr>
              {/if}
            {/each}
          {/if}
        </tbody>
      {/each}
    </table>
  </div>
</div>

<style>
  /* The card is the outer box; the scroller inside it carries the fade, so the card's own edge stays solid. */
  .table-card {
    flex: 0 1 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: clip;
    border: 1px solid transparent;
    border-radius: var(--r-lg);
    background:
      linear-gradient(var(--surface), var(--surface)) padding-box,
      var(--edge-grad);
    box-shadow: var(--edge-shadow);
  }
  /* Positioned, so visually hidden labels inside it scroll with it and cannot widen the page. scroll-padding-top keeps
     rows scrolled to from under the sticky header (36px and its hairline). */
  .table-scroll {
    position: relative;
    min-height: 0;
    overflow: auto;
    overscroll-behavior-x: contain;
    scroll-padding-top: 37px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    color: var(--fg-2);
  }
  th,
  td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--line);
    text-align: left;
    vertical-align: middle;
    font-weight: inherit;
  }
  :is(th, td):first-child {
    padding-left: 16px;
  }
  :is(th, td):last-child {
    padding-right: 16px;
  }
  tbody:last-child tr:last-child :is(th, td) {
    border-bottom: 0;
  }

  /* ----- header ----- */
  thead th {
    position: sticky;
    top: 0;
    z-index: var(--z-sticky);
    height: 36px;
    padding-block: 0;
    background: var(--surface);
    font-size: 12px;
    font-weight: var(--w-medium);
    color: var(--muted);
    white-space: nowrap;
  }
  .sort {
    all: unset;
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    min-height: 24px;
    color: var(--muted);
    cursor: pointer;
    white-space: nowrap;
    transition: color var(--dur) var(--ease-out);
  }
  .sort:hover {
    color: var(--fg-2);
  }
  .sort:focus-visible {
    border-radius: var(--r-sm);
    box-shadow: var(--ring);
  }
  th[aria-sort='ascending'] .sort,
  th[aria-sort='descending'] .sort {
    color: var(--fg);
  }
  th.num .sort {
    flex-direction: row-reverse;
  }
  .caret {
    display: inline-flex;
    color: var(--muted);
  }
  .caret.up {
    rotate: 180deg;
  }

  /* ----- cells ----- */
  .num {
    text-align: right;
    white-space: nowrap;
    font-family: var(--font-data);
    font-variant-numeric: tabular-nums;
  }
  .center {
    text-align: center;
  }
  .shrink {
    width: 1%;
    white-space: nowrap;
  }
  .row-head {
    color: var(--fg);
    font-weight: var(--w-medium);
    white-space: nowrap;
  }
  .actions {
    padding-block: 0;
  }

  /* ----- rows ----- */
  tbody tr:not(.group-row, .empty-row) {
    transition: background-color var(--dur-fast) var(--ease-out);
  }
  tbody tr:not(.group-row, .empty-row):hover {
    background: var(--fill-2);
  }
  tr.selectable {
    cursor: pointer;
  }
  tr.selectable:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  tr.is-selected,
  tr.is-selected:hover {
    background: var(--accent-soft);
    box-shadow: inset 2px 0 0 var(--accent);
  }

  /* ----- groups ----- */
  .group-row th {
    padding: 0;
    background: var(--fill-1);
  }
  .group-head {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding-right: 16px;
    transition: background-color var(--dur-fast) var(--ease-out);
  }
  .group-head:hover {
    background: var(--control-2);
  }
  /* The toggle's hit area covers the whole header row; the ⓘ sits above it. */
  .group-head > button {
    all: unset;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
    min-height: 24px;
    padding: 8px 12px 8px 16px;
    font-size: 13px;
    color: var(--fg);
    cursor: pointer;
    transition: color var(--dur-fast) var(--ease-out);
  }
  /* An open group's label steps back to --muted, so its rows lead; closed, it reads as --fg. */
  .group-head > button[aria-expanded='true'] {
    color: var(--muted);
  }
  .group-head > button::after {
    content: '';
    position: absolute;
    inset: 0;
  }
  .group-head > button:focus-visible::after {
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .group-head > :global(.info) {
    position: relative;
    z-index: 1;
  }
  .chev {
    display: inline-flex;
    color: var(--muted);
    rotate: 0deg;
    transition: rotate var(--dur) var(--ease-out);
  }
  .chev.open {
    rotate: 90deg;
  }
  .swatch {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--tone);
  }
  .group-label {
    font-weight: var(--w-medium);
  }
  .group-sub {
    color: var(--muted);
    font-size: 12px;
  }
  .group-count {
    margin-left: auto;
    font: var(--w-medium) 11px var(--font-data);
    font-variant-numeric: tabular-nums;
    color: var(--muted);
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .chev {
      transition: none;
    }
  }
  @media (pointer: coarse) {
    .sort,
    .group-head > button {
      min-height: 44px;
    }
  }
</style>
